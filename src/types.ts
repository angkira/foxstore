import { Event } from './dispatcher';

export const REDUCER_METAKEY = '@StoreReducers';

export const ACTION_METAKEY = '@StoreActions';

export const EFFECT_METAKEY = '@StoreEffects';

export const STORE_DECORATED_METAKEY = '@Store';

export enum HandlerName {
    Action = 'actions',
    Reducer = 'reducers',
    Effect = 'effects',
}

// = 'actions' | 'effects' | 'reducers';

export type HandlerFn<State extends Record<string, any> = Record<string, any>, Payload = any, ReturnType = void> = (payload: Payload, state: State) => ReturnType;

export type ActionFn<State extends Record<string, any> = Record<string, any>, Payload = any> = HandlerFn<State, Payload, Event>;

export type ReducerFn<State extends Record<string, any> = Record<string, any>, Payload = any> = HandlerFn<State, Payload, Partial<State>>;

export type EffectFn<State extends Record<string, any> = Record<string, any>, Payload = any> = HandlerFn<State, Payload>;;

export const simplyReducer = (fieldName: string): ReducerFn =>
    // @ts-ignore
    (payload: any): Record<string, any> => ({ [fieldName]: payload });

/**
 * Common Event-handlers options
 */
export type EventHandlerOptions = {
    requiredEvents?: {
        eventNames: string[],
        mode: 'once' | 'always',
    },
}
/**
 * Options for StoreAction for optimized handling
 *
 * @interface IActionOptions
 */
export type IActionOptions = EventHandlerOptions & {
    writeAs?: string; // To write gotten info exactly into Store as entity with selected name
}

export interface HandlerType {
    eventName: string | symbol;
    options?: EventHandlerOptions;
}

/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
export class MetaAction<State extends Record<string, any> = Record<string, any>, Payload = any> implements HandlerType {
    constructor(public eventName: string | symbol, public action: ActionFn<State, Payload>, public options?: IActionOptions) { }
}

/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
export class MetaReducer<State extends Record<string, any> = Record<string, any>, Payload = any> implements HandlerType {
    constructor(public eventName: string | symbol, public reducer: ReducerFn<State,Payload>, public options?: EventHandlerOptions) { }
}

/**
 * Side-effects
 *
 * @class MetaEffect
 */
export class MetaEffect<State extends Record<string, any> = Record<string, any>, Payload = any> implements HandlerType {
    constructor(public eventName: string | symbol, public effect: EffectFn<State,Payload>, public options?: EventHandlerOptions) { }
}

export type RawEventConfig<State extends Record<string, any>, Payload> = {
    actions?: [ActionFn<State, Payload>, IActionOptions][];
    reducers?: [ReducerFn<State, Payload>, EventHandlerOptions][];
    effects?: [EffectFn<State, Payload>, EventHandlerOptions][];
};

export class EventConfig<State extends Record<string, any> = Record<string, any>, Payload = any | void> {
    actions?: MetaAction<State, Payload>[];
    reducers?: MetaReducer<State, Payload>[];
    effects?: MetaEffect<State, Payload>[];
    payload?: Payload;
    constructor(eventName: string | symbol, config?: RawEventConfig<State, Payload>) {
        config && Object.assign(this, {
            [HandlerName.Action]: config.actions?.map(([action, options]) =>
                new MetaAction<State, Payload>(eventName, action, options)),
            [HandlerName.Reducer]: config.reducers?.map(([reducer, options]) =>
                new MetaReducer<State, Payload>(eventName, reducer, options)),
            [HandlerName.Effect]: config.actions?.map(([effect, options]) =>
                new MetaEffect<State, Payload>(eventName, effect, options)),
        })
    }
};

export type EventConfigByName<State extends Record<string, any> = Record<string, any>, Payload = any | void> = {
    [eventName: string | symbol]: EventConfig<State, Payload>,
}

export type EventSchemeType = Record<string | symbol, EventConfig>
