import { Observable, BehaviorSubject, pipe } from 'rxjs';
import { map as rxMap, takeUntil, shareReplay, take, map, distinctUntilChanged} from 'rxjs/operators';
import { identity, mergeDeepRight, path } from 'ramda';
import { Dispatcher, Event } from './dispatcher';
import { setupStoreEvents, setupEventsSchemeFromDecorators } from './decorators';
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
    HashMapFn?: (...args: any[]) => string | number | Symbol; // In the Future
}

export const DefaultStoreOptions: StoreOptions = {
    needHashMap: true,
    logOn: false,
    logger: console.log,
    logOptions: {
        events: true,
    },
}

/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template State - type | interface for state of Store
 */
export class ProtoStore<State extends object, EventScheme = HashMap<any>> {
    /**
     * Subject that contains
     *
     * @type {(ReplaySubject<State | {}>)}
     * @memberof ProtoStore
     */
    readonly store$: BehaviorSubject<State | {}> = new BehaviorSubject<State | {}>({});
    /**
     * Private event-bus-driver for this Store, to create Event-Namespace
     *
     * @type {Dispatcher}
     * @memberof ProtoStore
     */
    readonly eventDispatcher: Dispatcher;

    public options: StoreOptions;
    public eventScheme: EventSchemeType = {};

    constructor(
        initState?: State,
        options: StoreOptions | null = DefaultStoreOptions,
        customDispatcher?: Dispatcher | null,
        extraEventScheme?: EventSchemeType,
        ) {
            initState && this.patch(initState);

            this.options = Object.assign({}, DefaultStoreOptions, options);

            this.eventDispatcher = customDispatcher
                || new Dispatcher(new Event('storeInit'));

            !Reflect.getMetadata(STORE_DECORATED_METAKEY, this.constructor) &&
                setupEventsSchemeFromDecorators(this, extraEventScheme);

            setupStoreEvents<State, EventScheme>(this.eventScheme)(this);
    }
    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<State[K]>}
     * @memberof ProtoStore
     */
    select<K extends keyof State>(entityName: K): Observable<State[K]> {
        return pipe(
            distinctUntilChanged(),
            takeUntil<State[K]>(this.eventDispatcher.destroy$),
            shareReplay(1),
        )(this.store$.pipe(
                rxMap(path([entityName as string])),
                ) as Observable<State[K]>);
    }

    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {State}
     * @memberof ProtoStore
     */
    get snapshot(): State {
        return this.store$.getValue() as State;
    }

    /**
     * Patch current value of store by new.
     *
     * @param {State} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update: Partial<State>): this {
        const patchedState = Object.assign(
            mergeDeepRight<State, Partial<State>>(
                this.snapshot, update
            ),
            this.options?.needHashMap ?
                this.getHashMap(update) : {});
        this.store$.next(
                patchedState);

        this.options?.logOn
            && this.options.logOptions?.state
            && this.options.logger
            && this.options.logger(`${
                this.options?.storeName || this['constructor'].name
            } | State updated: `, patchedState)

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
        this.options.logOn
            && this.options.logOptions?.events
            && this.options.logger
            && this.options.logger(eventName);
            
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
    private getHashMap(value: Partial<State>): HashMap<any> {
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
