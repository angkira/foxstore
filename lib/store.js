"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoStore = exports.DefaultStoreOptions = exports.toHashMap = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const ramda_1 = require("ramda");
const dispatcher_1 = require("./dispatcher");
const decorators_1 = require("./decorators");
const types_1 = require("./types");
require("reflect-metadata");
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
exports.DefaultStoreOptions = {
    needHashMap: true,
};
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template InitState - type | interface for state of Store
 */
class ProtoStore {
    constructor(initState, options = exports.DefaultStoreOptions, customDispatcher, eventScheme) {
        this.options = options;
        /**
         * Subject that contains
         *
         * @type {(ReplaySubject<InitState | {}>)}
         * @memberof ProtoStore
         */
        this.store$ = new rxjs_1.BehaviorSubject({});
        initState && this.patch(initState);
        this.eventDispatcher = customDispatcher
            || new dispatcher_1.Dispatcher(new dispatcher_1.Event('storeInit'));
        eventScheme &&
            decorators_1.setupStoreEvents(eventScheme)(this);
        !Reflect.getMetadata(types_1.STORE_DECORATED_METAKEY, this.constructor) &&
            decorators_1.setupStoreEventsFromDecorators(this);
    }
    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<InitState[K]>}
     * @memberof ProtoStore
     */
    select(entityName) {
        return rxjs_1.pipe(operators_1.distinctUntilChanged(), operators_1.takeUntil(this.eventDispatcher.destroy$), operators_1.shareReplay(1))(this.store$.pipe(operators_1.map(ramda_1.path([entityName]))));
    }
    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {InitState}
     * @memberof ProtoStore
     */
    get snapshot() {
        return this.store$.getValue();
    }
    /**
     * Patch current value of store by new.
     *
     * @param {InitState} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update) {
        var _a;
        this.store$.next(Object.assign({}, this.snapshot, update, ((_a = this.options) === null || _a === void 0 ? void 0 : _a.needHashMap) ?
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
     * @param eventName
     * @param payload
     */
    dispatch(eventName, payload) {
        this.eventDispatcher.dispatch(new dispatcher_1.Event(eventName, payload));
        return this;
    }
    /**
     * This method lets to work with events dynamically
     *
     * @param eventName - event`s name to listen
     * @param callbackFn - function that gets payload of event as argument
     */
    on(eventName, callbackFn, options) {
        this.eventDispatcher
            .listen(eventName)
            .pipe((options.once ? operators_1.take(1) : operators_1.map(ramda_1.identity)))
            .subscribe((event) => callbackFn(event.payload));
        return this;
    }
    /**
     * For every list-entity in state returnes HashMap for easier using
     *
     */
    getHashMap(value) {
        if (!this.options || !this.options.HashMapKey) {
            return {};
        }
        else {
            return Object.keys(value)
                //@ts-ignore
                .filter((key) => Array.isArray(this.snapshot[key]))
                .map((entityKey) => ({
                name: entityKey,
                //@ts-ignore
                value: toHashMap(this.options.HashMapKey)(this.snapshot[entityKey]),
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
