import { Observable } from 'rxjs';
import { FoxEvent } from './dispatcher';
export declare const REDUCER_METAKEY = "@StoreReducers";
export declare const ACTION_METAKEY = "@StoreActions";
export declare const EFFECT_METAKEY = "@StoreEffects";
export declare const STORE_DECORATED_METAKEY = "@Store";
export declare type MaybeAsync<T> = Observable<T> | Promise<T> | T;
export declare enum HandlerName {
    Action = "actions",
    Reducer = "reducers",
    Effect = "effects"
}
export declare const HandlerNameList: HandlerName[];
export declare type HandlerFn<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown, ReturnType = void> = (payload: Payload, state: State) => ReturnType;
export declare type ActionFn<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> = HandlerFn<State, Payload, FoxEvent>;
export declare type ReducerFn<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> = HandlerFn<State, Payload, Partial<State>>;
export declare type EffectFn<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> = HandlerFn<State, Payload>;
export declare const simplyReducer: <State extends Record<string, unknown>, K extends keyof State = keyof State>(fieldName: K) => ReducerFn<State, State[K]>;
export declare type RequiredEventsOptions<EventName extends string | symbol = string> = {
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
export declare type EventHandlerOptions = {
    requiredEvents?: RequiredEventsOptions;
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
export declare class MetaAction<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> implements HandlerType {
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
export declare class MetaReducer<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> implements HandlerType {
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
export declare class MetaEffect<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> implements HandlerType {
    eventName: string | symbol;
    effect: EffectFn<State, Payload>;
    options?: EventHandlerOptions | undefined;
    constructor(eventName: string | symbol, effect: EffectFn<State, Payload>, options?: EventHandlerOptions | undefined);
}
export declare const HandlerClassMap: {
    actions: typeof MetaAction;
    reducers: typeof MetaReducer;
    effects: typeof MetaEffect;
};
export declare type RawEventConfig<State extends Record<string, unknown>, Payload> = {
    actions?: [ActionFn<State, Payload>, IActionOptions][];
    reducers?: [ReducerFn<State, Payload>, EventHandlerOptions][];
    effects?: [EffectFn<State, Payload>, EventHandlerOptions][];
};
export declare class EventConfig<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown | void> {
    [HandlerName.Action]?: MetaAction<State, Payload>[];
    [HandlerName.Reducer]?: MetaReducer<State, Payload>[];
    [HandlerName.Effect]?: MetaEffect<State, Payload>[];
    payload?: Payload;
    constructor(eventName: string | symbol, config?: RawEventConfig<State, Payload>);
}
export declare type EventSchemeType<State extends Record<string, unknown>, Payload = any> = Record<string | symbol, EventConfig<State, Payload>>;
export declare type EventSchemeKeys<State extends Record<string, unknown>, Scheme extends EventSchemeType<State>> = Exclude<keyof Scheme, number> | string | symbol;
export declare type EventConfigByName<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown | void> = {
    [eventName: string | symbol]: EventConfig<State, Payload>;
};
