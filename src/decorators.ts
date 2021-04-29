import { ProtoStore, StoreOptions } from './store';
import { withLatestFrom, mergeMap, take, shareReplay, tap, takeUntil, share } from 'rxjs/operators';
import { Dispatcher, Event } from './dispatcher';
import { of, Observable, merge, isObservable, noop, combineLatest } from 'rxjs';
import 'reflect-metadata';

import { assocPath, keys, mergeDeepRight } from 'ramda';
import { IActionOptions, MetaAction, ACTION_METAKEY, ActionFn, ReducerFn, MetaReducer, REDUCER_METAKEY, MetaEffect, EFFECT_METAKEY, EventSchemeType, STORE_DECORATED_METAKEY, MetaType } from './types';

/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
export function Action(eventName: string | string[], options?: IActionOptions, outputEventName?: string): MethodDecorator {
  return function (store: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const actions: MetaAction[] = Reflect.getMetadata(ACTION_METAKEY, store.constructor) || [];
    const action = descriptor.value as ActionFn;

    if (options?.writeAs) {
      if (outputEventName) {
        Reducer(outputEventName)(store, `${propertyKey as string}writeAs`,
          {value: (payload: unknown) =>
            assocPath(options?.writeAs.split('.'), payload)({})},
            )
      } else {
        throw new Error('You did not pass outputEventName for Action ' + (propertyKey as string));
      }
    }

    if (typeof eventName === 'string') {
      actions.push(new MetaAction(eventName, action, options));
    } else if (eventName?.length) {
      eventName.forEach(event =>
        actions.push(new MetaAction(event, action, options)))
    }
    
    Reflect.defineMetadata(ACTION_METAKEY, actions, store.constructor);
  };
}

/**
 * Reducer MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */

/**
 *
 */
export function Reducer(eventName: string | string[]): MethodDecorator {
  return function (store: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const reducer: ReducerFn = descriptor.value;
    const reducers: MetaReducer[] = Reflect.getMetadata(REDUCER_METAKEY, store.constructor) || [];

    if (typeof eventName === 'string') {
      reducers.push(new MetaReducer(eventName, reducer));
    } else if (eventName?.length) {
      eventName.forEach(event =>
        reducers.push(new MetaReducer(event, reducer)))
    }

    Reflect.defineMetadata(REDUCER_METAKEY, reducers, store.constructor);
  };
}

/**
 * Effect MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export function Effect(eventName: string | string[]): MethodDecorator {
  return function (store: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const effect = descriptor.value;
    const effects: MetaEffect[] = Reflect.getMetadata(EFFECT_METAKEY, store.constructor) || [];

    if (typeof eventName === 'string') {
      effects.push(new MetaEffect(eventName, effect));
    } else if (eventName?.length) {
      eventName.forEach(event =>
        effects.push(new MetaEffect(event, effect)))
    }
    
    Reflect.defineMetadata(EFFECT_METAKEY, effects, store.constructor);
  };
}


/**
 * Store decorator. Can be used for Injectable services like in Angular
 * Waiting for Decorators will became not "experimental" to work with types correctly.
 * Now, to use Store-class methods you should extend your class from ProtoStore, sorry.
 * I hope that in short time I will find way to use it in simplier way.
 * @export
 * @param {*} [initState]
 * @param {Dispatcher} [customDispatcher]
 * @returns {*}
 */
export function Store<InitState extends object = {}>(
  initState: InitState = Object(),
  customDispatcher?: Dispatcher,
  eventScheme: EventSchemeType = {},
): any {
  return function (target: any = Object): (args: any[]) => ProtoStore<typeof initState> {
    // save a reference to the original constructor

    // The new constructor behaviour
    const f: (args: any) => ProtoStore<InitState> = function (...args: any[]): ProtoStore<InitState> {
      // const newInstance = new ProtoStore<typeof initState>(initState);
      // newInstance['__proto__'] = original.prototype;

      Reflect.defineMetadata(STORE_DECORATED_METAKEY, true, target);

      const newInstance = new target(...args);

      newInstance.eventDispatcher = customDispatcher || newInstance.eventDispatcher;

      setupEventsSchemeFromDecorators<InitState>(newInstance, eventScheme);

      // Copy metadata from decorated class to new instance
      Reflect.getMetadataKeys(target)
        .forEach((key: string) => Reflect.defineMetadata(
          key,
          Reflect.getMetadata(key, target),
          newInstance,
        ));

      return newInstance;
    };

    f.prototype = target['__proto__'];

    return f;
  };
}

/**
 * Gets Actions, Reducers and Effects from metadata and create EventScheme
 * @param store
 * @param eventScheme
 */
export const setupEventsSchemeFromDecorators = <InitState extends object>(store: ProtoStore<InitState>, eventScheme: EventSchemeType = {}) => {
  const effects: MetaEffect[] = Reflect.getMetadata(EFFECT_METAKEY, store.constructor)
    || [];
  const reducers: MetaReducer[] = Reflect.getMetadata(REDUCER_METAKEY, store.constructor)
    || [];
  const actions: MetaAction[] = Reflect.getMetadata(ACTION_METAKEY, store.constructor)
    || [];

  const metadataEventScheme: EventSchemeType = eventScheme;

  const entityReducer = (entityName: 'actions' | 'effects' | 'reducers') =>
    (scheme: EventSchemeType, entity: MetaType) => {
      scheme[entity.eventName] ||= { [entityName]: [] };
      scheme[entity.eventName][entityName] ||= [];
      (scheme[entity.eventName][entityName] as (typeof entity)[]).push(entity);
      return scheme;
    }

  effects.reduce(entityReducer('effects'), metadataEventScheme);
  actions.reduce(entityReducer('actions'), metadataEventScheme);
  reducers.reduce(entityReducer('reducers'), metadataEventScheme);

  store.eventScheme = metadataEventScheme;
}
/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
export const setupStoreEvents = <State extends object, Scheme>(eventScheme: EventSchemeType = {}) =>
  (newInstance: ProtoStore<State, Scheme>) => {
    const reducerHandler = reducerMetaHandler(newInstance);

    const effectHandler = effectMetaHandler(newInstance);

    const actionHandler = actionMetaHandler(newInstance);

    const payloadStreams = (keys(eventScheme) as string[])
      .map((eventName: string) =>
        metaGetEntityPayload(newInstance)(eventName).pipe(
          tap(([payloadObject, state]) => {
            const logger = (newInstance.options?.logOn
              && newInstance.options?.logOptions?.events
              && newInstance.options?.logger) || noop;

            logger({
              event: eventName,
              payload: payloadObject
            });

            if (eventScheme[eventName].reducers instanceof Array
                && eventScheme[eventName].reducers?.length) {
              reducerHandler(payloadObject, state)(eventScheme[eventName].reducers as MetaReducer[]);
            }

            if (eventScheme[eventName].effects instanceof Array
                && eventScheme[eventName].effects?.length) {
              effectHandler(payloadObject, state)(eventScheme[eventName].effects as MetaEffect[]);
            }

            if (eventScheme[eventName].actions instanceof Array
                && eventScheme[eventName].actions?.length) {
              isObservable(payloadObject) ?
                payloadObject.pipe(take(1)).subscribe(payload =>
                  actionHandler(payload, state)(eventScheme[eventName].actions as MetaAction[]))
                : actionHandler(payloadObject, state)(eventScheme[eventName].actions as MetaAction[]);
            }
          }),
        ));

    merge(
      ...payloadStreams
    ).pipe(
      takeUntil(newInstance.eventDispatcher.destroy$),
    ).subscribe();

    return newInstance;
  }


/**
 * Get event payload
 * @param instance - Store instance
 */
function metaGetEntityPayload<State extends object>({ eventDispatcher, store$ }: ProtoStore<State>):
  (eventName: string) => Observable<[any, State]> {
  return (eventName: string) =>
    combineLatest([
      eventDispatcher
        .listen(eventName)
        .pipe(
          shareReplay(1),
          mergeMap((event: Event) =>
            (event.async ?
              event.payload
              : of(event.payload))
              .pipe(take(1))
              ),
          share<any>(),
          ),
        (store$ as Observable<State>).pipe(take(1)),
      ]);
}

/**
 * Handler for reducer
 * @param instance
 */
function reducerMetaHandler<State extends object>(instance: ProtoStore<State>) {
  return (payload: unknown, state: State) =>
    (reducers: MetaReducer[]) => {
      let result = state;

      reducers.forEach(reducer => {
        result = mergeDeepRight(result,
          reducer.reducer.call(instance, payload, result));
  
        instance.options.logOn && instance.options.logger
          && instance.options.logOptions?.reducers
          && instance.options.logger(`REDUCER: ${reducer.reducer.name}`);
      });

      instance.patch(result);
    }
}

/**
 * Handler for Effect
 * @param instance
 */
function effectMetaHandler<State extends object>(instance: ProtoStore<State>) {
  return (payload: unknown, state: State) =>
    (effects: MetaEffect[]) =>
      effects.forEach(effect => {
        effect.effect.call(instance, payload, state);

        instance.options.logOn && instance.options.logger
          && instance.options.logOptions?.effects
          && instance.options.logger(`EFFECT: ${effect.effect.name}`);
      });
        
}

/**
 * Handler for Action
 * @param instance
 */
function actionMetaHandler<State extends object>(instance: ProtoStore<State>) {
  return (payload: unknown, state: State) =>
    (actions: MetaAction[]) =>
      actions.forEach(action => {
        const result = action.action.call(instance, payload, state) as Event;
        instance.eventDispatcher.dispatch(result);

        instance.options.logOn && instance.options.logger
          && instance.options.logOptions?.actions
          && instance.options.logger(`ACTION: ${action.action.name}`);

        // TODO: Add writeAs support
        // instance.patch(
        //   simplyReducer(action.options?.writeAs)
        //     .call(
        //       instance,
        //       result.payload,
        //       state
        //     ));
      });
}

/**
 * Best way to create Store without classes.
 * Just set eventything and get new Store
 * @param initState - init state where you can set type of every entity in Store
 * @param customDispatcher - custom event dispatcher, if you need connect a few Stores
 * @param options - extra options for Store
 * @param eventScheme - scheme of events and its handlers
 *
 * @deprecated - Now you can give EventScheme to Store conctructor
 */
export const createStore = <InitState extends object,
  SchemeType extends EventSchemeType>(
    initState?: InitState,
    customDispatcher?: Dispatcher | null,
    options?: StoreOptions | null,
    eventScheme?: SchemeType | Object,
) => setupStoreEvents<InitState, SchemeType>(eventScheme as EventSchemeType)
    (new ProtoStore<InitState, SchemeType>(initState, options, customDispatcher))

/**
 * Function to fix type-checking of SchemeEvents
 * @param scheme Scheme Object
 */
export const schemeGen = <Scheme extends EventSchemeType>(scheme: Scheme) => scheme;
