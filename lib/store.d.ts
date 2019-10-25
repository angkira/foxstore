import { Observable } from 'rxjs';
import { Event } from './dispatcher';
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
export interface StoreOptions {
    storeName: string;
    needHashMap: boolean;
    HashMapKey?: string;
    HashMapFn?: (...args: any[]) => string | number | Symbol;
}
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template T - type | interface for state of Store
 */
export declare class ProtoStore<T> {
    private options?;
    /**
     * Subject that contains
     *
     * @private
     * @type {(ReplaySubject<T | {}>)}
     * @memberof ProtoStore
     */
    private store$;
    /**
     * Private event-bus-driver for this Store, to create Event-Namespace
     *
     * @private
     * @type {Dispatcher}
     * @memberof ProtoStore
     */
    private eventDispatcher;
    constructor(initState?: T, options?: StoreOptions | undefined);
    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<T[K]>}
     * @memberof ProtoStore
     */
    select<K extends keyof T>(entityName?: K): Observable<T[K] | T | {}>;
    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {T}
     * @memberof ProtoStore
     */
    readonly value: T;
    /**
     * Patch current value of store by new.
     *
     * @param {T} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update: T): this;
    /**
     * Clears the Store state by empty object.
     *
     * @memberof ProtoStore
     */
    clear(): this;
    /**
     * Ethernal method to dispatch Store Event
     *
     * @param {Event | string} event - new event of name for empty event (without payload) like InitEvent
     * @returns {this}
     * @memberof ProtoStore
     */
    dispatch(event: Event | string): this;
    /**
     * This method lets to work with events dynamically
     *
     * @param eventName - event`s name to listen
     * @param callbackFn - function that gets payload of event as argument
     */
    on(eventName: string, callbackFn: Function): this;
    /**
     * For every list-entity in state returnes HashMap for easier using
     *
     * @param mapKey
     */
    private getHashMap;
    /**
     * Method to destroy this Store and all subscriptions connected to it.
     *
     * @memberof ProtoStore
     */
    destroy(): void;
}
