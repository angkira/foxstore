import { Event } from './dispatcher';
export declare const REDUCER_METAKEY = "@StoreReducers";
export declare const ACTION_METAKEY = "@StoreActions";
export declare const EFFECT_METAKEY = "@StoreEffects";
export declare const STORE_DECORATED_METAKEY = "@Store";
export declare enum HandlerName {
    Action = "actions",
    Reducer = "reducers",
    Effect = "effects"
}
export declare type HandlerFn<State extends Record<string, any> = Record<string, any>, Payload = any, ReturnType = void> = (payload: Payload, state: State) => ReturnType;
export declare type ActionFn<State extends Record<string, any> = Record<string, any>, Payload = any> = HandlerFn<State, Payload, Event>;
export declare type ReducerFn<State extends Record<string, any> = Record<string, any>, Payload = any> = HandlerFn<State, Payload, Partial<State>>;
export declare type EffectFn<State extends Record<string, any> = Record<string, any>, Payload = any> = HandlerFn<State, Payload>;
export declare const simplyReducer: (fieldName: string) => ReducerFn;
/**
 * Common Event-handlers options
 */
export declare type EventHandlerOptions = {
    requiredEvents?: {
        eventNames: string[];
        mode: 'once' | 'always';
    };
};
/**
 * Options for StoreAction for optimized handling
 *
 * @interface IActionOptions
 */
export declare type IActionOptions = EventHandlerOptions & {
    writeAs?: string;
};
export interface HandlerType {
    eventName: string | symbol;
    options?: EventHandlerOptions;
}
/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
export declare class MetaAction<State extends Record<string, any> = Record<string, any>, Payload = any> implements HandlerType {
    eventName: string | symbol;
    action: ActionFn<State, Payload>;
    options?: IActionOptions | undefined;
    constructor(eventName: string | symbol, action: ActionFn<State, Payload>, options?: IActionOptions | undefined);
}
/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
export declare class MetaReducer<State extends Record<string, any> = Record<string, any>, Payload = any> implements HandlerType {
    eventName: string | symbol;
    reducer: ReducerFn<State, Payload>;
    options?: EventHandlerOptions | undefined;
    constructor(eventName: string | symbol, reducer: ReducerFn<State, Payload>, options?: EventHandlerOptions | undefined);
}
/**
 * Side-effects
 *
 * @class MetaEffect
 */
export declare class MetaEffect<State extends Record<string, any> = Record<string, any>, Payload = any> implements HandlerType {
    eventName: string | symbol;
    effect: EffectFn<State, Payload>;
    options?: EventHandlerOptions | undefined;
    constructor(eventName: string | symbol, effect: EffectFn<State, Payload>, options?: EventHandlerOptions | undefined);
}
export declare type RawEventConfig<State extends Record<string, any>, Payload> = {
    actions?: [ActionFn<State, Payload>, IActionOptions][];
    reducers?: [ReducerFn<State, Payload>, EventHandlerOptions][];
    effects?: [EffectFn<State, Payload>, EventHandlerOptions][];
};
export declare class EventConfig<State extends Record<string, any> = Record<string, any>, Payload = any | void> {
    actions?: MetaAction<State, Payload>[];
    reducers?: MetaReducer<State, Payload>[];
    effects?: MetaEffect<State, Payload>[];
    payload?: Payload;
    constructor(eventName: string | symbol, config?: RawEventConfig<State, Payload>);
}
export declare type EventConfigByName<State extends Record<string, any> = Record<string, any>, Payload = any | void> = {
    [eventName: string | symbol]: EventConfig<State, Payload>;
};
export declare type EventSchemeType = Record<string | symbol, EventConfig>;
