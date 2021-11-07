import {
    complement,
    filter,
    isEmpty,
    keys,
    last,
    map,
    mapObjIndexed,
} from 'ramda';
import {
    combineLatest,
    from,
    isObservable,
    merge,
    noop,
    Observable,
    of,
    zip,
} from 'rxjs';
import {
    map as rxMap,
    mergeMap,
    share,
    shareReplay,
    skipUntil,
    take,
    takeUntil,
    tap,
} from 'rxjs/operators';
import { HandlerName, RawEventConfig } from '.';
import { Event } from './dispatcher';
import { handleStreamOnce } from './helpers';
import { ProtoStore } from './store';
import {
    ACTION_METAKEY,
    EFFECT_METAKEY,
    EventConfig,
    EventSchemeType,
    MetaAction,
    MetaEffect,
    MetaReducer,
    HandlerType,
    REDUCER_METAKEY,
} from './types';

/**
 * Gets Actions, Reducers and Effects from metadata and create EventScheme
 * @param store
 * @param eventScheme
 */

export const setupEventsSchemeFromDecorators = <
    State extends Record<string, unknown>,
    Scheme extends EventSchemeType,
>(
    store: ProtoStore<State>,
    eventScheme: Scheme,
) => {
    const effects: MetaEffect[] =
        Reflect.getMetadata(EFFECT_METAKEY, store.constructor) || [];

    const reducers: MetaReducer[] =
        Reflect.getMetadata(REDUCER_METAKEY, store.constructor) || [];

    const actions: MetaAction[] =
        Reflect.getMetadata(ACTION_METAKEY, store.constructor) || [];

    const metadataEventScheme: EventSchemeType = eventScheme;

    const handlerReducerByType =
        (handlerName: HandlerName) =>
          (scheme: EventSchemeType, handler: HandlerType) => {
            scheme[handler.eventName as string] ||= { [handlerName]: [] };
            
            scheme[handler.eventName as string]![handlerName] ||= [];
            
            (scheme[handler.eventName as string]![handlerName] as typeof handler[]).push(handler);

            return scheme;
            };

    effects.reduce(handlerReducerByType(HandlerName.Effect), metadataEventScheme);
    actions.reduce(handlerReducerByType(HandlerName.Action), metadataEventScheme);
    reducers.reduce(handlerReducerByType(HandlerName.Reducer), metadataEventScheme);

    store.eventScheme = metadataEventScheme;
};

/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
export const setupStoreEvents =
    <State extends Record<string, unknown>,
    Scheme extends EventSchemeType>(
        eventScheme: Scheme
    ) =>
        (newInstance: ProtoStore<State, Scheme>) => {
            const reducerHandler = reducerMetaHandler(newInstance);

            const effectHandler = effectMetaHandler(newInstance);

            const actionHandler = actionMetaHandler(newInstance);

            const actionAsyncHandler = (
                payloadObject: Observable<unknown> | unknown,
                state: State,
                actions: MetaAction[]
            ) => {
                const applyAction = handleStreamOnce({
                    next: <T>(payload: T) =>
                        actionHandler(payload, state)(actions as MetaAction[]),
                });

                if (isObservable(payloadObject)) {
                    applyAction(payloadObject);
                    return;
                }

                if (payloadObject instanceof Promise) {
                    applyAction(from(payloadObject));
                    return;
                }

                actionHandler(payloadObject, state)(actions as MetaAction[]);
            };

            const isEventHasRequiredEvents = (handler: HandlerType) =>
                !!handler.options?.requiredEvents;

            const isEventHasNotRequiredEvents = complement(isEventHasRequiredEvents);

            const eventSchemeOfSimpleEvents = mapObjIndexed(
                mapObjIndexed(filter(isEventHasNotRequiredEvents))
            )(eventScheme);

            const eventSchemeOfRequiredEvents = mapObjIndexed(
                mapObjIndexed(filter(isEventHasRequiredEvents))
            )(eventScheme);

            const streamsWithRequiredEvents = Object.entries(
                eventSchemeOfRequiredEvents
            )
                .map(
                    ([eventName, eventConfig]: [string, EventConfig]) =>
                        mapObjIndexed(
                            map((handler: HandlerType) => [
                                metaGetPayloadForHandler(newInstance)(
                                    eventName,
                                    handler.options?.requiredEvents?.eventNames
                                ),
                                handler,
                            ])
                        )(eventConfig) as Record<
                            HandlerName,
                            [Observable<[any, State]>, HandlerType][]
                        >
                )
                .flatMap(({ actions, reducers, effects }) => [
                    ...(actions || []).map(
                        ([payload$, action]: [Observable<[any, State]>, HandlerType]) =>
                            payload$.pipe(
                                tap((payload) =>
                                    actionAsyncHandler(...payload, [action as MetaAction])
                                )
                            )
                    ),
                    ...(reducers || []).map(
                        ([payload$, reducer]: [Observable<[any, State]>, HandlerType]) =>
                            payload$.pipe(
                                tap((payload) =>
                                    reducerHandler(...payload)([reducer as MetaReducer])
                                )
                            )
                    ),
                    ...(effects || []).map(
                        ([payload$, effect]: [Observable<[any, State]>, HandlerType]) =>
                            payload$.pipe(
                                tap((payload) =>
                                    effectHandler(...payload)([effect as MetaEffect])
                                )
                            )
                    ),
                ]);

            const payloadStreams = (keys(eventSchemeOfSimpleEvents) as string[])
                .filter((eventName) =>
                    Object.values(eventSchemeOfSimpleEvents[eventName]).some(
                        complement(isEmpty)
                    )
                )
                .map((eventName: string) =>
                    metaGetPayloadForHandler(newInstance)(eventName).pipe(
                        tap(([payloadObject, state]) => {
                            const logger =
                                (newInstance.options?.logOptions?.logOn &&
                                    newInstance.options?.logOptions?.events &&
                                    newInstance.options?.logOptions?.logger) ||
                                noop;

                            logger({
                                event: eventName,
                                payload: payloadObject,
                            });

                            const { actions, reducers, effects } =
                                eventSchemeOfSimpleEvents[eventName];

                            if (reducers instanceof Array && reducers?.length) {
                                reducerHandler(payloadObject, state)(reducers as MetaReducer[]);
                            }

                            if (effects instanceof Array && effects?.length) {
                                effectHandler(payloadObject, state)(effects as MetaEffect[]);
                            }

                            if (actions instanceof Array && actions?.length) {
                                actionAsyncHandler(payloadObject, state, actions as MetaAction[]);
                            }
                        })
                    )
                );

            merge(...payloadStreams, ...streamsWithRequiredEvents)
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
    EventScheme extends EventSchemeType>({
        eventDispatcher,
        store$,
    }: ProtoStore<State, EventScheme>): (
        eventName: string,
        requiredEvents?: string[]
    ) => Observable<[any, State]> {
    return (eventName: string, requiredEvents?: string[]) => {
        const requiredEventStreams = requiredEvents?.map((eventName) =>
            eventDispatcher.listen(eventName)
        );

        return combineLatest([
            (requiredEventStreams?.length
                ? merge(
                    // For first value emitting
                    zip(
                        ...requiredEventStreams,
                        eventDispatcher.listen(eventName)
                    ).pipe(take(1), rxMap(last)) as Observable<Event>,
                    // Waiting for Required Events emitted
                    eventDispatcher
                        .listen(eventName)
                        .pipe(skipUntil(zip(...requiredEventStreams)))
                )
                : eventDispatcher.listen(eventName)
            ).pipe(
                shareReplay(1),
                mergeMap(({ payload }: Event) =>
                    (payload instanceof Promise || isObservable(payload)
                        ? from(payload)
                        : of(payload)
                    ).pipe(take(1))
                ),
                share<any>()
            ),
            (store$ as Observable<State>).pipe(take(1)),
        ]);
    };
}
/**
 * Handler for reducer
 * @param instance
 */
function reducerMetaHandler<State extends Record<string, unknown>, EventScheme extends EventSchemeType>(
    instance: ProtoStore<State, EventScheme>
) {
    return (payload: unknown, state: State) => (reducers: MetaReducer[]) => {
        let result = state;

        reducers.forEach((reducer) => {
            result = Object.assign(
                result,
                reducer.reducer.call(instance, payload, result)
            );

            instance.options?.logOptions?.logOn &&
                instance.options.logOptions?.reducers &&
                instance.options.logOptions.logger?.(`REDUCER: ${reducer.reducer.name}`);
        });

        instance.patch(result);
    };
}
/**
 * Handler for Effect
 * @param instance
 */
function effectMetaHandler<State extends Record<string, unknown>, EventScheme extends EventSchemeType>(
    instance: ProtoStore<State, EventScheme>
) {
    return (payload: unknown, state: State) => (effects: MetaEffect[]) =>
        effects.forEach((effect) => {
            effect.effect.call(instance, payload, state);

            instance.options?.logOptions?.logOn &&
                instance.options.logOptions.effects &&
                instance.options.logOptions.logger?.(`EFFECT: ${effect.effect.name}`);
        });
}
/**
 * Handler for Action
 * @param instance
 */
function actionMetaHandler<State extends Record<string, unknown>, EventScheme extends EventSchemeType>(
    instance: ProtoStore<State, EventScheme>
) {
    return (payload: unknown, state: State) => (actions: MetaAction[]) =>
        actions.forEach((action) => {
            const result = action.action.call(instance, payload, state) as Event;
            instance.eventDispatcher.dispatch(result);

            instance.options?.logOptions?.logOn &&
                instance.options.logOptions.actions &&
                instance.options.logOptions.logger?.(`ACTION: ${action.action.name}`);
        });
}

/**
 * Function to fix type-checking of SchemeEvents
 * @param scheme Scheme Object
 */

export const schemeGen = <Scheme extends EventSchemeType>(scheme: Scheme): Scheme =>
    scheme;

const HandlerClassMap = {
    actions: MetaAction,
    reducers: MetaReducer,
    effects: MetaEffect,
}

export const createHandlers = <State extends Record<string, unknown>, Payload>(
    config: RawEventConfig<State, Payload>
) => (eventName: string | symbol): EventConfig<State, Payload> => new EventConfig(eventName, config)
        
        // [eventName]: mapObjIndexed(
        //     (handlers: [HandlerFn, EventHandlerOptions][], handlerName: HandlerName) =>
        //         handlers.map(([handlerFn, options]) =>
        //             new HandlerClassMap[handlerName](eventName as string, handlerFn, options)))
        //     (config)
