import { Event } from './dispatcher';
export const REDUCER_METAKEY = '@StoreReducers';
export const ACTION_METAKEY = '@StoreActions';
export const EFFECT_METAKEY = '@StoreEffects';
export const STORE_DECORATED_METAKEY = '@Store';
export type ActionFn<Payload = any> = (payload: Payload, state?: any) => Event;
export type ReducerFn<Payload = any> = (payload: Payload, state?: any) => typeof state;
export type EffectFn<Payload = any> = (payload: Payload, state?: any) => void;
export const simplyReducer: ReducerFn = (fieldName: string) => (payload: any) => ({ [fieldName]: payload });

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
    writeAs: string; // To write gotten info exactly into Store as entity with selected name
}

export interface MetaType {
    eventName: string;
    options?: EventHandlerOptions;
}

/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
export class MetaAction implements MetaType {
    constructor(public eventName: string, public action: ActionFn, public options?: IActionOptions) { }
}
/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
export class MetaReducer implements MetaType {
    constructor(public eventName: string, public reducer: ReducerFn, public options?: EventHandlerOptions) { }
}
/**
 * Side-effects
 *
 * @class MetaEffect
 */
export class MetaEffect implements MetaType {
    constructor(public eventName: string, public effect: EffectFn, public options?: EventHandlerOptions) { }
}

export type EventConfig = {
    actions?: MetaAction[];
    reducers?: MetaReducer[];
    effects?: MetaEffect[];
};
export type EventSchemeType = {
    [eventName: string]: EventConfig;
};
