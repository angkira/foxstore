import { Observable } from 'rxjs';

import { FoxEvent } from './dispatcher';

export const REDUCER_METAKEY = '@StoreReducers';

export const ACTION_METAKEY = '@StoreActions';

export const EFFECT_METAKEY = '@StoreEffects';

export const STORE_DECORATED_METAKEY = '@Store';

export type MaybeAsync<T> = Observable<T> | Promise<T> | T;

export enum HandlerName {
  Action = 'actions',
  Reducer = 'reducers',
  Effect = 'effects',
}

export const HandlerNameList: HandlerName[] = [
  HandlerName.Action,
  HandlerName.Reducer,
  HandlerName.Effect,
];

export type HandlerFn<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown,
  ReturnType = void
> = (payload: Payload, state: State) => ReturnType;

export type ActionFn<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown
> = HandlerFn<State, Payload, FoxEvent>;

export type ReducerFn<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown
> = HandlerFn<State, Payload, Partial<State>>;

export type EffectFn<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown
> = HandlerFn<State, Payload>;

export type RequiredEventsOptions<EventName extends string | symbol = string> = {
  /**
   * Events which are nessesary to handle main event
   */
  eventNames: EventName[];
  /**
   * If true, the guard-events would be 
   * nessesary everytime for getting main event
   */
  always: boolean;
};

/**
 * Common Event-handlers options
 */
export type EventHandlerOptions = {
  requiredEvents?: RequiredEventsOptions;
  order?: number,
};

/**
 * Options for StoreAction for optimized handling
 *
 * @interface IActionOptions
 */
export type IActionOptions = EventHandlerOptions & {
  writeAs?: string; // To write gotten info exactly into Store as entity with selected name
};

export interface HandlerType<
  State extends Record<string, unknown>,
  Payload,
> {
  eventName: string | symbol;
  options?: EventHandlerOptions;
  handler: HandlerFn<State, Payload>
}

/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
export class MetaAction<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown
> implements HandlerType<State, Payload>
{
  constructor(
    public eventName: string | symbol,
    public handler: ActionFn<State, Payload>,
    public options?: IActionOptions
  ) {}
}

/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
export class MetaReducer<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown
> implements HandlerType<State, Payload>
{
  constructor(
    public eventName: string | symbol,
    public handler: ReducerFn<State, Payload>,
    public options?: EventHandlerOptions
  ) {}
}

/**
 * Side-effects
 *
 * @class MetaEffect
 */
export class MetaEffect<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown
> implements HandlerType<State, Payload>
{
  constructor(
    public eventName: string | symbol,
    public handler: EffectFn<State, Payload>,
    public options?: EventHandlerOptions
  ) {}
}

export const HandlerClassMap = {
  [HandlerName.Action]: MetaAction,
  [HandlerName.Reducer]: MetaReducer,
  [HandlerName.Effect]: MetaEffect,
}

export type RawEventConfig<State extends Record<string, unknown>, Payload> = {
  actions?: ([ActionFn<State, Payload>, IActionOptions] | [ActionFn<State, Payload>])[];
  reducers?: ([ReducerFn<State, Payload>, EventHandlerOptions] | [ReducerFn<State, Payload>])[];
  effects?: ([EffectFn<State, Payload>, EventHandlerOptions] | [EffectFn<State, Payload>])[];
};

export class EventConfig<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown | void
> {
  [HandlerName.Action]?: MetaAction<State, Payload>[] = [];
  [HandlerName.Reducer]?: MetaReducer<State, Payload>[] = [];
  [HandlerName.Effect]?: MetaEffect<State, Payload>[] = [];
  payload?: Payload;

  constructor(
    eventName: string | symbol,
    config?: RawEventConfig<State, Payload>
  ) {
    config &&
      Object.assign(this, {
        [HandlerName.Action]: config.actions?.map(
          ([action, options]) =>
            new MetaAction<State, Payload>(eventName, action, options)
        ) || [],
        [HandlerName.Reducer]: config.reducers?.map(
          ([reducer, options]) =>
            new MetaReducer<State, Payload>(eventName, reducer, options)
        ) || [],
        [HandlerName.Effect]: config.actions?.map(
          ([effect, options]) =>
            new MetaEffect<State, Payload>(eventName, effect, options)
        ) || [],
      });
  }
}

export type EventSchemeType<
  State extends Record<string, unknown>,
  Payload = any
> = Record<string | symbol, EventConfig<State, Payload>>;

export type EventSchemeKeys<
  State extends Record<string, unknown>,
  Scheme extends EventSchemeType<State>
> = Exclude<keyof Scheme, number> | string | symbol;

export type EventConfigByName<
  State extends Record<string, unknown> = Record<string, unknown>,
  Payload = unknown | void
> = {
  [eventName: string | symbol]: EventConfig<State, Payload>;
};
