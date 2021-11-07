import { Observable, BehaviorSubject } from 'rxjs';
import { Dispatcher } from './dispatcher';
import { EventSchemeType } from "./types";
import 'reflect-metadata';
import { StoreOptions } from './options';
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template State - type | interface for state of Store
 */
export declare class ProtoStore<State extends Record<string, any>, EventScheme extends EventSchemeType> {
    private initState?;
    eventScheme?: EventScheme | undefined;
    options: StoreOptions;
    readonly eventDispatcher: Dispatcher;
    /**
     * Subject that contains
     *
     * @type {(ReplaySubject<State | {}>)}
     * @memberof ProtoStore
     */
    readonly store$: BehaviorSubject<State | {}>;
    constructor(initState?: State | undefined, eventScheme?: EventScheme | undefined, options?: StoreOptions, eventDispatcher?: Dispatcher);
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
     * Resets the Store state by init state.
     *
     * @memberof ProtoStore
     */
    reset(): this;
    /**
     * Ethernal method to dispatch Store Event
     * @param eventName
     * @param payload
     */
    dispatch<EventName extends keyof EventScheme, Payload extends EventScheme[EventName]['payload']>(eventName: EventName, payload?: Payload): this;
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
