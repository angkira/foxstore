import { ReplaySubject, Observable } from 'rxjs';
import { Dispatcher } from './dispatcher';
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
    storeName?: string;
    needHashMap: boolean;
    HashMapKey?: string;
    HashMapFn?: (...args: any[]) => string | number | Symbol;
}
export declare const DefaultStoreOptions: StoreOptions;
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template InitState - type | interface for state of Store
 */
export declare class ProtoStore<InitState, EventScheme = HashMap<any>> {
    private options;
    /**
     * Subject that contains
     *
     * @type {(ReplaySubject<InitState | {}>)}
     * @memberof ProtoStore
     */
    readonly store$: ReplaySubject<InitState | {}>;
    /**
     * Private event-bus-driver for this Store, to create Event-Namespace
     *
     * @type {Dispatcher}
     * @memberof ProtoStore
     */
    readonly eventDispatcher: Dispatcher;
    constructor(initState?: InitState, options?: StoreOptions | null, customDispatcher?: Dispatcher | null);
    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<InitState[K]>}
     * @memberof ProtoStore
     */
    select<K extends keyof InitState>(entityName?: K): Observable<InitState[K] | InitState | {}>;
    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {InitState}
     * @memberof ProtoStore
     */
    readonly value: InitState;
    /**
     * Patch current value of store by new.
     *
     * @param {InitState} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update: InitState): this;
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
    dispatch<Payload>(eventName: keyof EventScheme & string, payload?: Payload): this;
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
