import { ProtoStore, StoreOptions } from './store';
import { Dispatcher } from './dispatcher';
import 'reflect-metadata';
import { IActionOptions, EventSchemeType } from './types';
/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
export declare function Action(eventName: string | string[], options?: IActionOptions, outputEventName?: string): MethodDecorator;
/**
 * Reducer MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
/**
 *
 */
export declare function Reducer(eventName: string | string[]): MethodDecorator;
/**
 * Effect MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export declare function Effect(eventName: string | string[]): MethodDecorator;
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
export declare function Store<InitState extends object = {}>(initState?: InitState, customDispatcher?: Dispatcher, eventScheme?: EventSchemeType): any;
/**
 * Gets Actions, Reducers and Effects from metadata and create EventScheme
 * @param store
 * @param eventScheme
 */
export declare const setupEventsSchemeFromDecorators: <InitState extends object>(store: ProtoStore<InitState, import("./store").HashMap<any>>, eventScheme?: EventSchemeType) => void;
/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
export declare const setupStoreEvents: <State extends object, Scheme>(eventScheme?: EventSchemeType) => (newInstance: ProtoStore<State, Scheme>) => ProtoStore<State, Scheme>;
/**
 * Best way to create Store without classes.
 * Just set eventything and get new Store
 * @param initState - init state where you can set type of every entity in Store
 * @param customDispatcher - custom event dispatcher, if you need connect a few Stores
 * @param options - extra options for Store
 * @param eventScheme - scheme of events and its handlers
 *
 * @deprecated - Now you can give EventScheme to Store conctructor
 */
export declare const createStore: <InitState extends object, SchemeType extends EventSchemeType>(initState?: InitState | undefined, customDispatcher?: Dispatcher | null | undefined, options?: StoreOptions | null | undefined, eventScheme?: Object | SchemeType | undefined) => ProtoStore<InitState, SchemeType>;
/**
 * Function to fix type-checking of SchemeEvents
 * @param scheme Scheme Object
 */
export declare const schemeGen: <Scheme extends EventSchemeType>(scheme: Scheme) => Scheme;
