import { Event } from './dispatcher';
export declare const REDUCER_METAKEY = "@StoreReducers";
export declare const ACTION_METAKEY = "@StoreActions";
export declare const EFFECT_METAKEY = "@StoreEffects";
export declare const STORE_DECORATED_METAKEY = "@Store";
export declare type ActionFn<Payload = any> = (payload: Payload, state?: any) => Event;
export declare type ReducerFn<Payload = any> = (payload: Payload, state?: any) => typeof state;
export declare type EffectFn<Payload = any> = (payload: Payload, state?: any) => void;
export declare const simplyReducer: ReducerFn;
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
    writeAs: string;
};
export interface MetaType {
    eventName: string;
    options?: EventHandlerOptions;
}
/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
export declare class MetaAction implements MetaType {
    eventName: string;
    action: ActionFn;
    options?: IActionOptions | undefined;
    constructor(eventName: string, action: ActionFn, options?: IActionOptions | undefined);
}
/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
export declare class MetaReducer implements MetaType {
    eventName: string;
    reducer: ReducerFn;
    options?: EventHandlerOptions | undefined;
    constructor(eventName: string, reducer: ReducerFn, options?: EventHandlerOptions | undefined);
}
/**
 * Side-effects
 *
 * @class MetaEffect
 */
export declare class MetaEffect implements MetaType {
    eventName: string;
    effect: EffectFn;
    options?: EventHandlerOptions | undefined;
    constructor(eventName: string, effect: EffectFn, options?: EventHandlerOptions | undefined);
}
export declare type EventConfig = {
    actions?: MetaAction[];
    reducers?: MetaReducer[];
    effects?: MetaEffect[];
};
export declare type EventSchemeType = {
    [eventName: string]: EventConfig;
};
