import { Observable } from 'rxjs';
import { FoxEvent } from './dispatcher';
export declare const REDUCER_METAKEY = "@StoreReducers";
export declare const ACTION_METAKEY = "@StoreActions";
export declare const EFFECT_METAKEY = "@StoreEffects";
export declare const STORE_DECORATED_METAKEY = "@Store";
export type MaybeAsync<T> = Observable<T> | Promise<T> | T;
export declare enum HandlerName {
    Action = "actions",
    Reducer = "reducers",
    Effect = "effects"
}
export declare const HandlerNameList: HandlerName[];
export type HandlerFn<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown, ReturnType = void> = (payload: Payload, state: State) => ReturnType;
export type ActionFn<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> = HandlerFn<State, Payload, FoxEvent>;
export type ReducerFn<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> = HandlerFn<State, Payload, Partial<State>>;
export type EffectFn<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> = HandlerFn<State, Payload>;
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
    order?: number;
};
/**
 * Options for StoreAction for optimized handling
 *
 * @interface IActionOptions
 */
export type IActionOptions = EventHandlerOptions & {
    writeAs?: string;
};
export interface HandlerType<State extends Record<string, unknown>, Payload> {
    eventName: string | symbol;
    options?: EventHandlerOptions;
    handler: HandlerFn<State, Payload>;
}
/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
export declare class MetaAction<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> implements HandlerType<State, Payload> {
    eventName: string | symbol;
    handler: ActionFn<State, Payload>;
    options?: IActionOptions | undefined;
    constructor(eventName: string | symbol, handler: ActionFn<State, Payload>, options?: IActionOptions | undefined);
}
/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
export declare class MetaReducer<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> implements HandlerType<State, Payload> {
    eventName: string | symbol;
    handler: ReducerFn<State, Payload>;
    options?: EventHandlerOptions | undefined;
    constructor(eventName: string | symbol, handler: ReducerFn<State, Payload>, options?: EventHandlerOptions | undefined);
}
/**
 * Side-effects
 *
 * @class MetaEffect
 */
export declare class MetaEffect<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown> implements HandlerType<State, Payload> {
    eventName: string | symbol;
    handler: EffectFn<State, Payload>;
    options?: EventHandlerOptions | undefined;
    constructor(eventName: string | symbol, handler: EffectFn<State, Payload>, options?: EventHandlerOptions | undefined);
}
export declare const HandlerClassMap: {
    actions: typeof MetaAction;
    reducers: typeof MetaReducer;
    effects: typeof MetaEffect;
};
export type RawEventConfig<State extends Record<string, unknown>, Payload> = {
    actions?: ([ActionFn<State, Payload>, IActionOptions] | [ActionFn<State, Payload>])[];
    reducers?: ([ReducerFn<State, Payload>, EventHandlerOptions] | [ReducerFn<State, Payload>])[];
    effects?: ([EffectFn<State, Payload>, EventHandlerOptions] | [EffectFn<State, Payload>])[];
};
export declare class EventConfig<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown | void> {
    [HandlerName.Action]?: MetaAction<State, Payload>[];
    [HandlerName.Reducer]?: MetaReducer<State, Payload>[];
    [HandlerName.Effect]?: MetaEffect<State, Payload>[];
    payload?: Payload;
    constructor(eventName: string | symbol, config?: RawEventConfig<State, Payload>);
}
export type EventSchemeType<State extends Record<string, unknown>, Payload = any> = Record<string | symbol, EventConfig<State, Payload>>;
export type EventSchemeKeys<State extends Record<string, unknown>, Scheme extends EventSchemeType<State>> = Exclude<keyof Scheme, number> | string | symbol;
export type EventConfigByName<State extends Record<string, unknown> = Record<string, unknown>, Payload = unknown | void> = {
    [eventName: string | symbol]: EventConfig<State, Payload>;
};
