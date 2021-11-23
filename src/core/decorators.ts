import 'reflect-metadata';

import { writeAs } from '../helpers';
import { Dispatcher } from './dispatcher';
import { setupEventsSchemeFromDecorators } from './setup';
import { ProtoStore } from './store';
import {
  ACTION_METAKEY,
  ActionFn,
  EFFECT_METAKEY,
  EffectFn,
  EventHandlerOptions,
  EventSchemeType,
  HandlerFn,
  HandlerType,
  IActionOptions,
  MetaAction,
  MetaEffect,
  MetaReducer,
  REDUCER_METAKEY,
  ReducerFn,
  STORE_DECORATED_METAKEY,
} from './types';

const writeHandlerByReflectKey = <
  State extends Record<string, unknown>,
  Payload,
  HandlerConstructor extends { new(...args: any): HandlerType<State, Payload> },
  Options extends EventHandlerOptions,
  >(
    eventName: string | string[],
    options: Options | undefined,
    store: ProtoStore<State>,
    KEY: string,
    handler: HandlerFn<State, Payload>,
    handlerMetaClass: HandlerConstructor,
) => {
  const handlers: HandlerType<State, Payload>[] = Reflect.getMetadata(KEY, store.constructor) || [];

    if (typeof eventName === 'string') {
      handlers.push(
        new handlerMetaClass(eventName, handler, options) as HandlerType<State, Payload>);
    } else if (eventName instanceof Array) {
      handlers.push(...eventName.map(event =>
        new handlerMetaClass(event, handler, options) as HandlerType<State, Payload>));
    }
    
    Reflect.defineMetadata(KEY, handlers, store.constructor);
}

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
  ) {
  return function <
    State extends Record<string, unknown>,
    Payload,
  >(
    store: ProtoStore<State>,
    propertyKey: string | symbol,
    { value: action }: { value?: ActionFn<State, Payload> },
  ) {
    if (!action) {
      return;
    }

    writeHandlerByReflectKey(
      eventName,
      options,
      store,
      ACTION_METAKEY,
      action,
      MetaAction,
    );

    if (!options || !options.writeAs) {
      return;
    }

    if (outputEventName) {
      Reducer(outputEventName, { order: 0 })(store, `${propertyKey as string}writeAs`,
        {
          value: writeAs<State>(options?.writeAs)
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
  ) {
  return function <
    State extends Record<string, unknown>,
    Payload,
    >(
    store: ProtoStore<State>,
    propertyKey: string | symbol,
    { value: reducer }: TypedPropertyDescriptor<ReducerFn<State, Payload>>,
  ) {
    if (!reducer) { return; }

    writeHandlerByReflectKey(
      eventName,
      options,
      store,
      REDUCER_METAKEY,
      reducer,
      MetaReducer,
    );
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
  ) {
  return function <
    State extends Record<string, unknown>,
    Payload,
    >(
    store: ProtoStore<State>,
    propertyKey: string | symbol,
    { value: effect }: TypedPropertyDescriptor<EffectFn<State, Payload>>,
  ) {
    if (!effect) { return; }

    writeHandlerByReflectKey(
      eventName,
      options,
      store,
      EFFECT_METAKEY,
      effect,
      MetaEffect,
    );
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
