import { ReplaySubject, Observable, BehaviorSubject, Subject, identity, pipe } from 'rxjs';
import { map as rxMap, takeUntil, shareReplay, take, map, distinctUntilChanged} from 'rxjs/operators';
import { last, path, tap } from 'ramda';
import { Dispatcher, Event } from './dispatcher';
import { setupStoreEvents, setupStoreEventsFromDecorators } from './decorators';
import { EventSchemeType, STORE_DECORATED_METAKEY } from "./types";
import 'reflect-metadata';

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
export class ProtoStore<InitState, EventScheme = HashMap<any>> {
    /**
     * Subject that contains
     *
     * @type {(ReplaySubject<InitState | {}>)}
     * @memberof ProtoStore
     */
    readonly store$: BehaviorSubject<InitState | {}> = new BehaviorSubject<InitState | {}>({});
    /**
     * Private event-bus-driver for this Store, to create Event-Namespace
     *
     * @type {Dispatcher}
     * @memberof ProtoStore
     */
    readonly eventDispatcher: Dispatcher;

    constructor(
        initState?: InitState,
        private options: StoreOptions | null = DefaultStoreOptions,
        customDispatcher?: Dispatcher | null,
        eventScheme?: EventSchemeType,
        ) {
            initState && this.patch(initState);

            this.eventDispatcher = customDispatcher
                || new Dispatcher(new Event('storeInit'));

            eventScheme &&
                setupStoreEvents<InitState, EventScheme>(eventScheme)(this);

            !Reflect.getMetadata(STORE_DECORATED_METAKEY, this.constructor) &&
                setupStoreEventsFromDecorators(this);
    }
    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<InitState[K]>}
     * @memberof ProtoStore
     */
    select<K extends keyof InitState>(entityName?: K): Observable<InitState[K] | InitState> {
        if (entityName) {
            return pipe(
                distinctUntilChanged(),
                takeUntil<InitState[K] | InitState>(this.eventDispatcher.destroy$),
                shareReplay(1),
            )(this.store$.pipe(
                rxMap(path<InitState[K]>([entityName as string])),
                ) as Observable<InitState[K]>)
        } else {
            return pipe(
                distinctUntilChanged(),
                takeUntil<InitState[K] | InitState>(this.eventDispatcher.destroy$),
                shareReplay(1),
            )(this.store$.asObservable() as Observable<InitState>);
        }
        
    }

    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {InitState}
     * @memberof ProtoStore
     */
    get snapshot(): InitState | {} {
        return this.store$.getValue();
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
                Object.assign({}, this.snapshot, update,
                    this.options?.needHashMap ?
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
     * @param eventName
     * @param payload
     */
    dispatch<Payload = void>(eventName: keyof EventScheme, payload?: Payload): this {
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
    on(eventName: string, callbackFn: Function, options: {
        once: boolean,
    }): this {
        this.eventDispatcher
            .listen(eventName)
            .pipe((options.once ? take(1) : map(identity)))
            .subscribe((event: Event) => callbackFn(event.payload));
        return this;
    }

    /**
     * For every list-entity in state returnes HashMap for easier using
     *
     */
    private getHashMap(value: InitState): HashMap<any> {
        if (!this.options || !this.options.HashMapKey) {
            return {};
        } else {
            return  Object.keys(value)
                    //@ts-ignore
                .filter((key: string) => Array.isArray(this.snapshot[key]))
                .map((entityKey: string) => ({
                        name: entityKey,
                        //@ts-ignore
                        value: toHashMap(this.options.HashMapKey)(this.snapshot[entityKey]),
                    }))
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
