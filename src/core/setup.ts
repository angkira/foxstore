import { complement as not, filter, identity, ifElse, isEmpty, last, map, mapObjIndexed, pick } from 'ramda';
import { iif, merge, Observable, zip } from 'rxjs';
import { map as rxMap, shareReplay, skipUntil, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';

import { EventSchemeKeys, HandlerName, HandlerNameList, MaybeAsync, RawEventConfig, RequiredEventsOptions } from '..';
import { applyCallbackToMaybeAsync } from '../helpers';
import { FoxEvent } from './dispatcher';
import { ProtoStore } from './store';
import {
    ACTION_METAKEY,
    EFFECT_METAKEY,
    EventConfig,
    EventSchemeType,
    HandlerType,
    MetaAction,
    MetaEffect,
    MetaReducer,
    REDUCER_METAKEY,
} from './types';

/**
 * Gets Actions, Reducers and Effects from metadata and create EventScheme
 * @param store
 * @param eventScheme
 */

export const setupEventsSchemeFromDecorators = <
  State extends Record<string, unknown>,
  Scheme extends EventSchemeType<State>
>(
  store: ProtoStore<State>,
  eventScheme: Scheme
) => {
  const effects: MetaEffect[] =
    Reflect.getMetadata(EFFECT_METAKEY, store.constructor) || [];

  const reducers: MetaReducer[] =
    Reflect.getMetadata(REDUCER_METAKEY, store.constructor) || [];

  const actions: MetaAction[] =
    Reflect.getMetadata(ACTION_METAKEY, store.constructor) || [];

  const metadataEventScheme: EventSchemeType<State> = eventScheme;

  const handlerReducerByType =
    (handlerName: HandlerName) =>
    (scheme: EventSchemeType<State>, handler: HandlerType) => {
      scheme[handler.eventName as string] ||= { [handlerName]: [] };

      scheme[handler.eventName as string]![handlerName] ||= [];

      (
        scheme[handler.eventName as string]![handlerName] as typeof handler[]
      ).push(handler);

      return scheme;
    };

  effects.reduce(handlerReducerByType(HandlerName.Effect), metadataEventScheme);
  actions.reduce(handlerReducerByType(HandlerName.Action), metadataEventScheme);
  reducers.reduce(
    handlerReducerByType(HandlerName.Reducer),
    metadataEventScheme
  );

  store.eventScheme = metadataEventScheme;
};

type Handler<State extends Record<string, unknown>, Payload> =
  | MetaAction<State, Payload>
  | MetaReducer<State, Payload>
  | MetaEffect<State, Payload>;

const handlerApplicator = <
  State extends Record<string, unknown>,
  Payload,
  H extends Handler<State, Payload> = Handler<State, Payload>
>(
  payloadObject: MaybeAsync<Payload>,
  state: State,
  handlers: H[],
  handlerToApply: (payload: Payload, state: State) => (handlers: H[]) => void
) => applyCallbackToMaybeAsync((payload: Payload) => handlerToApply(payload, state)(handlers))(payloadObject);

/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
export const setupStoreEvents =
  <
    State extends Record<string, unknown>,
    Scheme extends EventSchemeType<State>
  >(
    eventScheme: Scheme
  ) =>
  (newInstance: ProtoStore<State, Scheme>) => {
    const handlerParserMap = {
      [HandlerName.Action]: actionMetaHandler(newInstance),
      [HandlerName.Reducer]: reducerMetaHandler(newInstance),
      [HandlerName.Effect]: effectMetaHandler(newInstance),
    };

    const hasRequiredEvents = (handler: HandlerType) =>
      !!handler.options?.requiredEvents;

    const hasNotRequiredEvents = not(hasRequiredEvents);

    type ClearEventConfig<Payload> = Pick<
      EventConfig<State, Payload>,
      HandlerName
    >;

    const filterSchemeHandlers =
      (predicate: (handler: HandlerType) => boolean) => (scheme: Scheme) =>
        mapObjIndexed(
          <Payload>(eventConfig: EventConfig<State, Payload>) =>
            mapObjIndexed(
              ifElse(
                isEmpty,
                identity,
                filter<Handler<State, Payload>>(predicate)
              ),
              pick(HandlerNameList)(eventConfig)
            ),
          scheme
        ) as Scheme;

    const eventSchemeOfSimpleEvents =
      filterSchemeHandlers(hasNotRequiredEvents)(eventScheme);

    const eventSchemeOfRequiredEvents =
      filterSchemeHandlers(hasRequiredEvents)(eventScheme);    

    type ExtendedEventConfig<Payload> = Record<
      HandlerName,
      [Observable<[Payload, State]>, Handler<State, Payload>][]
    >;

    const eventSchemeToHandledStreams = (eventScheme: Scheme) =>
      Object.entries(eventScheme)
        .map(
          <Payload>([eventName, eventConfig]: [
            EventSchemeKeys<State, Scheme>,
            ClearEventConfig<Payload>
          ]) =>
            mapObjIndexed(
              map((handler: Handler<State, Payload>) => [
                metaGetPayloadForHandler<State, Scheme>(newInstance)(
                  eventName,
                  handler.options?.requiredEvents,
                ),
                handler,
              ]),
              eventConfig
            ) as ExtendedEventConfig<Payload>
        )
        .flatMap(<Payload>(config: ExtendedEventConfig<Payload>) =>
          HandlerNameList.flatMap((handlerName) =>
            config![handlerName]
              ? config[handlerName].map(
                  <H extends Handler<State, Payload>>([payload$, handler]: [
                    Observable<[Payload, State]>,
                    H
                  ]) =>
                    payload$.pipe(
                      tap(([payload, state]: [Payload, State]) =>
                        handlerApplicator<State, Payload, H>(
                          payload,
                          state,
                          [handler],
                          handlerParserMap[handlerName] as (
                            payload: Payload,
                            state: State
                          ) => (handlers: H[]) => void
                        )
                      )
                    )
                )
              : []
          )
        );

    const payloadStreams = [
      eventSchemeOfSimpleEvents,
      eventSchemeOfRequiredEvents,
    ].flatMap(eventSchemeToHandledStreams);

    merge(...payloadStreams)
      .pipe(takeUntil(newInstance.eventDispatcher.destroy$))
      .subscribe();

    return newInstance;
  };
/**
 * Get event payload
 * @param instance - Store instance
 */
function metaGetPayloadForHandler<
  State extends Record<string, unknown>,
  EventScheme extends EventSchemeType<State>,
  EventName extends Exclude<keyof EventScheme, number> | string | symbol =
    | Exclude<keyof EventScheme, number>
    | string
    | symbol,
  Payload extends EventScheme[EventName]["payload"] = EventScheme[EventName]["payload"]
>(store: ProtoStore<State, EventScheme>) {
  return (
    eventName: EventName,
    requiredEvents?: RequiredEventsOptions<EventSchemeKeys<State, EventScheme>>
  ): Observable<[Payload, State]> => {
    const requiredEventStreams =
      requiredEvents?.eventNames
        ?.map((eventName) => store.listen(eventName)) ?? [];

    const mainEvent$: Observable<FoxEvent<Payload>> = store.listen(eventName);

    const firstValue$: Observable<FoxEvent<Payload>> = iif(
      () => !!requiredEventStreams?.length,
      zip(...requiredEventStreams, mainEvent$).pipe(
        rxMap((streams) => last(streams) as FoxEvent<Payload>)
      ),
      mainEvent$
    ).pipe(take(1));

    return (
      requiredEventStreams?.length
        ? merge(
          firstValue$,
          requiredEvents?.mode === 'always' 
            ? mainEvent$.pipe(skipUntil(zip(...requiredEventStreams)))
            : mainEvent$,
          )
        : mainEvent$
    ).pipe(
      rxMap((event) => event?.payload as Payload),
      withLatestFrom(store.store$.asObservable() as Observable<State>),
      shareReplay<[Payload, State]>(1),
    );
  };
}
/**
 * Handler for reducer
 * @param instance
 */
function reducerMetaHandler<
  State extends Record<string, unknown>,
  EventScheme extends EventSchemeType<State>
>(instance: ProtoStore<State, EventScheme>) {
  return <Payload>(payload: Payload, state: State) =>
    (reducers: MetaReducer<State, Payload>[]) => {
      let result = state;

      reducers.forEach((reducer) => {
        result = Object.assign(
          result,
          reducer.reducer.call(instance, payload, result)
        );

        instance.log(reducer.reducer.name, HandlerName.Reducer);
      });

      instance.patch(result);
    };
}
/**
 * Handler for Effect
 * @param instance
 */
function effectMetaHandler<
  State extends Record<string, unknown>,
  EventScheme extends EventSchemeType<State>
>(instance: ProtoStore<State, EventScheme>) {
  return <Payload>(payload: Payload, state: State) =>
    (effects: MetaEffect<State, Payload>[]) =>
      effects.forEach((effect) => {
        effect.effect.call(instance, payload, state);

        instance.log(effect.effect.name, HandlerName.Effect);
      });
}
/**
 * Handler for Action
 * @param instance
 */
function actionMetaHandler<
  State extends Record<string, unknown>,
  EventScheme extends EventSchemeType<State>
>(instance: ProtoStore<State, EventScheme>) {
  return <Payload>(payload: Payload, state: State) =>
    (actions: MetaAction<State, Payload>[]) =>
      actions.forEach((action) => {
        const result = action.action.call(instance, payload, state);

        instance.eventDispatcher.dispatch(result);

        instance.log(action.action.name, HandlerName.Action);
      });
}

export const createHandlers =
  <State extends Record<string, unknown>, Payload>(
    config: RawEventConfig<State, Payload>
  ) =>
  (eventName: string | symbol): EventConfig<State, Payload> =>
    new EventConfig(eventName, config);
