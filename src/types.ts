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
 * Options for StoreAction for optimized handling
 *
 * @interface IActionOptions
 */
export interface IActionOptions {
    writeAs: string; // To write gotten info exactly into Store as entity with selected name
}
/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
export class MetaAction {
    constructor(public eventName: string, public action: ActionFn, public options?: IActionOptions) { }
}
/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
export class MetaReducer {
    constructor(public eventName: string, public reducer: ReducerFn, public options?: IActionOptions) { }
}
/**
 * Side-effects
 *
 * @class MetaEffect
 */
export class MetaEffect {
    constructor(public eventName: string, public effect: EffectFn, public options?: IActionOptions) { }
}
export type MetaType = MetaAction | MetaReducer | MetaEffect;
export type EventConfig = {
    actions?: MetaAction[];
    reducers?: MetaReducer[];
    effects?: MetaEffect[];
};
export type EventSchemeType = {
    [eventName: string]: EventConfig;
};
