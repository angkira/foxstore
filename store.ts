import { ReplaySubject, Observable } from 'rxjs';
import { map as rxMap, takeUntil, shareReplay} from 'rxjs/operators';
import { last, path } from 'ramda';
import { Dispatcher, Event } from './dispatcher';

type HashMap<T> = {[key: string]: T}
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
            item: T & { [key: string]: string | number | Symbol}) =>
                acc[key] = item, {});
}

export interface StoreOptions {
    needHashMap: boolean;
    HashMapKey?: string;
    HashMapFn?: (...args: any[]) => string | number | Symbol; // In the Future
}

/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template T - type | interface for state of Store
 */
export class ProtoStore<T> {
    /**
     * Subject that contains 
     *
     * @private
     * @type {(ReplaySubject<T | {}>)}
     * @memberof ProtoStore
     */
    private store$: ReplaySubject<T | {}> = new ReplaySubject<T | {}>();
    /**
     * Private event-bus-driver for this Store, to create Event-Namespace
     *
     * @private
     * @type {Dispatcher}
     * @memberof ProtoStore
     */
    private eventDispatcher: Dispatcher = new Dispatcher();

    constructor(
        initState?: T,
        private options: StoreOptions,
        ) {
        if (initState) {
            this.patch(initState);
        }
        this.dispatch(new Event('storeInit'));
    }

    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<T[K]>}
     * @memberof ProtoStore
     */
    select<K extends keyof T>(entityName?: K): Observable<T[K]> {
        return (entityName ?
            this.store$.pipe(
                rxMap(path(entityName)),
            ) : this.store$.asObservable())
            .pipe(
                takeUntil(this.eventDispatcher.destroy$),
                shareReplay(1),
            ) as Observable<T[K]>;
    }

    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {T}
     * @memberof ProtoStore
     */
    get value(): T {
        const events = this.store$['_events'];
        return last(events);
    }

    /**
     * Patch current value of store by new.
     *
     * @param {T} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update: T): this {
        this.store$.next(
                Object.assign({}, this.value, update,
                    this.options.needHashMap ? this.getHashMap(update) : {}));
        // console.log('store patched by ', update); Turn on to watch Store changes

        return this;
    }

    /**
     * Clears the Store state by empty object.
     *
     * @memberof ProtoStore
     */
    clear(): void {
        this.store$.next({});
    }

    /**
     * Ethernal method to dispatch Store Event
     *
     * @param {Event} event
     * @returns {this}
     * @memberof ProtoStore
     */
    dispatch(event: Event): this {
        this.eventDispatcher.dispatch(event);
        return this;
    }

    /**
     * For every list-entiy in state returnes HashMap for easier using
     * 
     * @param mapKey 
     */
    private getHashMap(value: Object): HashMap<any> {
        return  Object.keys(value)
            .filter((key: string) => Array.isArray(this.value[key]))
            .map((entityKey: string) =>
                ({name: entityKey, value: toHashMap(this.options.HashMapKey)(this.value[entityKey])}))
            .reduce((mapObject: HashMap<any>, entity: {name: string, value: HashMap<any>}) => {
                return mapObject[`${entity.name}_Map`] = entity.value;
            }, {});
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
