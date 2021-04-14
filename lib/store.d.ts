import { Observable, BehaviorSubject } from 'rxjs';
import { Dispatcher } from './dispatcher';
import { EventSchemeType } from "./types";
import 'reflect-metadata';
export declare type HashMap<T> = {
    [key: string]: T;
};
/**
 * Curried function-helper to convert collection to hashMap by choosen key
 *
 * @export
 * @template T
 * @param {string} key
 * @returns
 */
export declare function toHashMap<T>(key: string): (list: T[]) => HashMap<T>;
interface LogOptions {
    events?: boolean;
    reducers?: boolean;
    actions?: boolean;
    effects?: boolean;
    state?: boolean;
}
export interface StoreOptions {
    storeName?: string;
    logger?: (...args: unknown[]) => void;
    logOn?: boolean;
    logOptions?: LogOptions;
    needHashMap?: boolean;
    HashMapKey?: string;
    HashMapFn?: (...args: any[]) => string | number | Symbol;
}
export declare const DefaultStoreOptions: StoreOptions;
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template State - type | interface for state of Store
 */
export declare class ProtoStore<State extends object, EventScheme = HashMap<any>> {
    /**
     * Subject that contains
     *
     * @type {(ReplaySubject<State | {}>)}
     * @memberof ProtoStore
     */
    readonly store$: BehaviorSubject<State | {}>;
    /**
     * Private event-bus-driver for this Store, to create Event-Namespace
     *
     * @type {Dispatcher}
     * @memberof ProtoStore
     */
    readonly eventDispatcher: Dispatcher;
    options: StoreOptions;
    eventScheme: EventSchemeType;
    constructor(initState?: State, options?: StoreOptions | null, customDispatcher?: Dispatcher | null, extraEventScheme?: EventSchemeType);
    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<State[K]>}
     * @memberof ProtoStore
     */
    select<K extends keyof State>(entityName: K): Observable<State[K]>;
    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {State}
     * @memberof ProtoStore
     */
    get snapshot(): State;
    /**
     * Patch current value of store by new.
     *
     * @param {State} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update: Partial<State>): this;
    /**
     * Clears the Store state by empty object.
     *
     * @memberof ProtoStore
     */
    clear(): this;
    /**
     * Ethernal method to dispatch Store Event
     * @param eventName
     * @param payload
     */
    dispatch<Payload = void>(eventName: keyof EventScheme, payload?: Payload): this;
    /**
     * This method lets to work with events dynamically
     *
     * @param eventName - event`s name to listen
     * @param callbackFn - function that gets payload of event as argument
     */
    on(eventName: string, callbackFn: Function, options: {
        once: boolean;
    }): this;
    /**
     * For every list-entity in state returnes HashMap for easier using
     *
     */
    private getHashMap;
    /**
     * Method to destroy this Store and all subscriptions connected to it.
     *
     * @memberof ProtoStore
     */
    destroy(): void;
}
export {};
