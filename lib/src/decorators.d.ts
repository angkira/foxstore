import { Dispatcher, Event } from './dispatcher';
import 'reflect-metadata';
export declare type ActionFn = (payload: any, state?: any) => Event;
export declare type ReducerFn = (payload: any, state?: any) => typeof state;
export declare type EffectFn = (payload: any, state?: any) => void;
/**
 * Options for StoreAction for optimized handling
 *
 * @interface IActionOptions
 */
interface IActionOptions {
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
/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
export declare function Action(eventName: string, options?: IActionOptions): MethodDecorator;
/**
 * Reducer MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export declare function Reducer(eventName: string): MethodDecorator;
/**
 * Effect MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export declare function Effect(eventName: string): MethodDecorator;
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
export declare function Store(initState?: any, customDispatcher?: Dispatcher): any;
export {};
