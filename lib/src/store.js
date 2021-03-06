"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const ramda_1 = require("ramda");
const dispatcher_1 = require("./dispatcher");
/**
 * Curried function-helper to convert collection to hashMap by choosen key
 *
 * @export
 * @template T
 * @param {string} key
 * @returns
 */
function toHashMap(key) {
    return (list) => list.reduce((acc, item) => acc[item[key]] = item, {});
}
exports.toHashMap = toHashMap;
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template T - type | interface for state of Store
 */
class ProtoStore {
    constructor(initState, options) {
        this.options = options;
        /**
         * Subject that contains
         *
         * @private
         * @type {(ReplaySubject<T | {}>)}
         * @memberof ProtoStore
         */
        this.store$ = new rxjs_1.ReplaySubject();
        /**
         * Private event-bus-driver for this Store, to create Event-Namespace
         *
         * @private
         * @type {Dispatcher}
         * @memberof ProtoStore
         */
        this.eventDispatcher = new dispatcher_1.Dispatcher();
        if (initState) {
            this.patch(initState);
        }
        this.dispatch(new dispatcher_1.Event('storeInit'));
    }
    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<T[K]>}
     * @memberof ProtoStore
     */
    select(entityName) {
        return (entityName ?
            this.store$.pipe(operators_1.map(ramda_1.path(entityName))) : this.store$.asObservable())
            .pipe(
        // @ts-ignore
        operators_1.takeUntil(this.eventDispatcher.destroy$), operators_1.shareReplay(1));
    }
    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {T}
     * @memberof ProtoStore
     */
    get value() {
        const events = this.store$['_events'];
        return ramda_1.last(events);
    }
    /**
     * Patch current value of store by new.
     *
     * @param {T} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update) {
        this.store$.next(Object.assign({}, this.value, update, this.options && this.options.needHashMap ?
            this.getHashMap(update) : {}));
        // console.log('store patched by ', update); Turn on to watch Store changes
        return this;
    }
    /**
     * Clears the Store state by empty object.
     *
     * @memberof ProtoStore
     */
    clear() {
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
    dispatch(event) {
        event instanceof dispatcher_1.Event ?
            this.eventDispatcher.dispatch(event)
            : this.eventDispatcher.dispatch(new dispatcher_1.Event(event));
        return this;
    }
    /**
     * This method lets to work with events dynamically
     *
     * @param eventName - event`s name to listen
     * @param callbackFn - function that gets payload of event as argument
     */
    on(eventName, callbackFn) {
        this.eventDispatcher
            .listen(eventName)
            .subscribe((event) => callbackFn(event.payload));
        return this;
    }
    /**
     * For every list-entity in state returnes HashMap for easier using
     *
     * @param mapKey
     */
    getHashMap(value) {
        if (!this.options || !this.options.HashMapKey) {
            return {};
        }
        else {
            return Object.keys(value)
                //@ts-ignore
                .filter((key) => Array.isArray(this.value[key]))
                .map((entityKey) => ({
                name: entityKey,
                //@ts-ignore
                value: toHashMap(this.options.HashMapKey)(this.value[entityKey])
            }))
                .reduce((mapObject, entity) => {
                return mapObject[`${entity.name}_Map`] = entity.value;
            }, {});
        }
    }
    /**
     * Method to destroy this Store and all subscriptions connected to it.
     *
     * @memberof ProtoStore
     */
    destroy() {
        this.eventDispatcher.emitDestroy();
    }
}
exports.ProtoStore = ProtoStore;
