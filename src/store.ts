import { ReplaySubject, Observable } from 'rxjs';
import { map as rxMap, takeUntil, shareReplay} from 'rxjs/operators';
import { last, path } from 'ramda';
import { Dispatcher, Event } from './dispatcher';

export type HashMap<T> = {[key: string]: T}
/**
 * Curried function-helper to convert collection to hashMap by choosen key
 *
 * @export
 * @template T
 * @param {string} key
 * @returns
 */
export function toHashMap<T>(key: string): (list: T[]) => HashMap<T> {
    return (list: T[]) =>
        list.reduce((
            acc: HashMap<T>,
            item: any) =>
                acc[item[key]] = item, {});
}

export interface StoreOptions {
    storeName?: string;
    needHashMap: boolean;
    HashMapKey?: string;
    HashMapFn?: (...args: any[]) => string | number | Symbol; // In the Future
}

export const DefaultStoreOptions: StoreOptions = {
    needHashMap: true,
}

/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template InitState - type | interface for state of Store
 */
export class ProtoStore<InitState, EventScheme extends Object = {}> {
    /**
     * Subject that contains
     *
     * @type {(ReplaySubject<InitState | {}>)}
     * @memberof ProtoStore
     */
    readonly store$: ReplaySubject<InitState | {}> = new ReplaySubject<InitState | {}>();
    /**
     * Private event-bus-driver for this Store, to create Event-Namespace
     *
     * @type {Dispatcher}
     * @memberof ProtoStore
     */
    readonly eventDispatcher: Dispatcher;

    constructor(    
        initState?: InitState,
        private options?: StoreOptions,
        customDispatcher?: Dispatcher,
        ) {        
        if (initState) {
            this.patch(initState);
        }
        this.eventDispatcher = customDispatcher
            || new Dispatcher(new Event('storeInit'));
    }

    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<InitState[K]>}
     * @memberof ProtoStore
     */
    select<K extends keyof InitState>(entityName?: K): Observable<InitState[K] | InitState | {}> {
        return (entityName ?
            this.store$.pipe(
                rxMap(path([entityName as string])),
            ) : this.store$.asObservable())
            .pipe(
                // @ts-ignore
                takeUntil(this.eventDispatcher.destroy$),
                shareReplay(1),
            )
    }

    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {InitState}
     * @memberof ProtoStore
     */
    get value(): InitState {
        const events = this.store$['_events'];
        return last(<InitState[]>events);
    }

    /**
     * Patch current value of store by new.
     *
     * @param {InitState} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update: InitState): this {
        this.store$.next(
                Object.assign({}, this.value, update,
                    this.options && this.options.needHashMap ?
                        this.getHashMap(update) : {}));
        // console.log('store patched by ', update); Turn on to watch Store changes

        return this;
    }

    /**
     * Clears the Store state by empty object.
     *
     * @memberof ProtoStore
     */
    clear(): this {
        this.store$.next({});
        return this;
    }

    /**
     * Ethernal method to dispatch Store Event
     *
     * @param {Event | string} event - new event of name for empty event (without payload) like InitEvent
     * @returns {this}
     * @memberof ProtoStore
     */
    dispatch<Payload>(eventName: keyof EventScheme, payload?: Payload): this {
        this.eventDispatcher.dispatch(
            new Event(eventName as string, payload));
        return this;
    }

    /**
     * This method lets to work with events dynamically
     *
     * @param eventName - event`s name to listen
     * @param callbackFn - function that gets payload of event as argument
     */
    on(eventName: string, callbackFn: Function): this {
        this.eventDispatcher
            .listen(eventName)
            .subscribe((event: Event) => callbackFn(event.payload));
        return this;
    }

    /**
     * For every list-entity in state returnes HashMap for easier using
     *
     * @param mapKey
     */
    private getHashMap(value: InitState): HashMap<any> {
        if (!this.options || !this.options.HashMapKey) {
            return {};
        } else {
            return  Object.keys(value)
                    //@ts-ignore
                .filter((key: string) => Array.isArray(this.value[key]))
                .map((entityKey: string) => ({
                        name: entityKey,
                        //@ts-ignore
                        value: toHashMap(this.options.HashMapKey)(this.value[entityKey])}))
                .reduce((mapObject: HashMap<any>, entity: {name: string, value: HashMap<any>}) => {
                    return mapObject[`${entity.name}_Map`] = entity.value;
                }, {});
        }


    }

    /**
     * Method to destroy this Store and all subscriptions connected to it.
     *
     * @memberof ProtoStore
     */
    destroy(): void {
        this.eventDispatcher.emitDestroy();
    }
}
