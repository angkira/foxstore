import 'reflect-metadata';

import { assocPath } from 'ramda';

import { Dispatcher } from './dispatcher';
import { setupEventsSchemeFromDecorators } from './setup';
import { ProtoStore } from './store';
import {
    ACTION_METAKEY,
    ActionFn,
    EFFECT_METAKEY,
    EventHandlerOptions,
    EventSchemeType,
    IActionOptions,
    MetaAction,
    MetaEffect,
    MetaReducer,
    REDUCER_METAKEY,
    ReducerFn,
    STORE_DECORATED_METAKEY,
} from './types';

/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
export function Action(
  eventName: string | string[],
  options?: IActionOptions,
  outputEventName?: string,
  ): MethodDecorator {
  return function (
    store: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
    ) {
    const actions: MetaAction[] = Reflect.getMetadata(ACTION_METAKEY, store.constructor) || [];

    const action = descriptor.value as ActionFn;

    if (typeof eventName === 'string') {
      actions.push(new MetaAction(eventName, action, options));
    } else if (eventName instanceof Array) {
        actions.push(...eventName.map(event => new MetaAction(event, action, options)));
    }
    
    Reflect.defineMetadata(ACTION_METAKEY, actions, store.constructor);

    if (!options?.writeAs) {
      return;
    }

    if (outputEventName) {
      Reducer(outputEventName)(store, `${propertyKey as string}writeAs`,
        {
          value: (payload: unknown) =>
            options?.writeAs ?
              assocPath(options?.writeAs.split('.'), payload)({})
              : {}
          },
          )
    } else {
      throw new Error('You did not pass outputEventName for Action ' + (propertyKey as string));
    }
  };
}

/**
 * Reducer MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export function Reducer(
  eventName: string | string[],
  options?: EventHandlerOptions,
  ): MethodDecorator {
  return function (store: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const reducer: ReducerFn = descriptor.value;
    const reducers: MetaReducer[] = Reflect.getMetadata(REDUCER_METAKEY, store.constructor) || [];

    if (typeof eventName === 'string') {
      reducers.push(new MetaReducer(eventName, reducer, options));
    } else if (eventName?.length) {
      eventName.forEach(event =>
        reducers.push(new MetaReducer(event, reducer, options)))
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
export function Effect(
  eventName: string | string[],
  options?: EventHandlerOptions,
  ): MethodDecorator {
  return function (store: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const effect = descriptor.value;
    const effects: MetaEffect[] = Reflect.getMetadata(EFFECT_METAKEY, store.constructor) || [];

    if (typeof eventName === 'string') {
      effects.push(new MetaEffect(eventName, effect, options));
    } else if (eventName?.length) {
      eventName.forEach(event =>
        effects.push(new MetaEffect(event, effect, options)))
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
export function Store<
  State extends Record<string, unknown> = {},
  EventScheme extends EventSchemeType<State> = EventSchemeType<State>
  >(
  initState: State = Object(),
  eventScheme: EventScheme,
  customDispatcher?: Dispatcher,
): any {
  return function (target: any = Object): (args: any[]) => ProtoStore<typeof initState> {
    const f: (args: any) => ProtoStore<State> = function (...args: any[]): ProtoStore<State> {
      Reflect.defineMetadata(STORE_DECORATED_METAKEY, true, target);

      const newInstance = new target(...args);

      newInstance.eventDispatcher = customDispatcher || newInstance.eventDispatcher;

      setupEventsSchemeFromDecorators<State, EventScheme>(newInstance, eventScheme);

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
