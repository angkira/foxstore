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
 * Options for StoreAction for optimized handling
 *
 * @interface IActionOptions
 */
export interface IActionOptions {
    writeAs: string;
}
/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
export declare class MetaAction {
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
export declare class MetaReducer {
    eventName: string;
    reducer: ReducerFn;
    options?: IActionOptions | undefined;
    constructor(eventName: string, reducer: ReducerFn, options?: IActionOptions | undefined);
}
/**
 * Side-effects
 *
 * @class MetaEffect
 */
export declare class MetaEffect {
    eventName: string;
    effect: EffectFn;
    options?: IActionOptions | undefined;
    constructor(eventName: string, effect: EffectFn, options?: IActionOptions | undefined);
}
export declare type MetaType = MetaAction | MetaReducer | MetaEffect;
export declare type EventConfig = {
    actions?: MetaAction[];
    reducers?: MetaReducer[];
    effects?: MetaEffect[];
};
export declare type EventSchemeType = {
    [eventName: string]: EventConfig;
};
