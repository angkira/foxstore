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
    logOn: false,
    logger: console.log,
    logOptions: {
        events: true,
    },
};
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template State - type | interface for state of Store
 */
class ProtoStore {
    constructor(initState, options = exports.DefaultStoreOptions, customDispatcher, extraEventScheme) {
        /**
         * Subject that contains
         *
         * @type {(ReplaySubject<State | {}>)}
         * @memberof ProtoStore
         */
        this.store$ = new rxjs_1.BehaviorSubject({});
        this.eventScheme = {};
        initState && this.patch(initState);
        this.options = Object.assign({}, exports.DefaultStoreOptions, options);
        this.eventDispatcher = customDispatcher
            || new dispatcher_1.Dispatcher(new dispatcher_1.Event('storeInit'));
        !Reflect.getMetadata(types_1.STORE_DECORATED_METAKEY, this.constructor) &&
            decorators_1.setupEventsSchemeFromDecorators(this, extraEventScheme);
        decorators_1.setupStoreEvents(this.eventScheme)(this);
    }
    /**
     * Selecting stream with data from Store by key.
     *
     * @template K
     * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
     * @returns {Observable<State[K]>}
     * @memberof ProtoStore
     */
    select(entityName) {
        return rxjs_1.pipe(operators_1.distinctUntilChanged(), operators_1.takeUntil(this.eventDispatcher.destroy$), operators_1.shareReplay(1))(this.store$.pipe(operators_1.map(ramda_1.path([entityName]))));
    }
    /**
     * Hack to get current value of Store as Object
     *
     * @readonly
     * @type {State}
     * @memberof ProtoStore
     */
    get snapshot() {
        return this.store$.getValue();
    }
    /**
     * Patch current value of store by new.
     *
     * @param {State} update
     * @returns {this}
     * @memberof ProtoStore
     */
    patch(update) {
        var _a, _b, _c, _d;
        const patchedState = Object.assign(ramda_1.mergeDeepRight(this.snapshot, update), ((_a = this.options) === null || _a === void 0 ? void 0 : _a.needHashMap) ?
            this.getHashMap(update) : {});
        this.store$.next(patchedState);
        ((_b = this.options) === null || _b === void 0 ? void 0 : _b.logOn)
            && ((_c = this.options.logOptions) === null || _c === void 0 ? void 0 : _c.state)
            && this.options.logger
            && this.options.logger(`${((_d = this.options) === null || _d === void 0 ? void 0 : _d.storeName) || this['constructor'].name} | State updated: `, patchedState);
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
        var _a;
        this.options.logOn
            && ((_a = this.options.logOptions) === null || _a === void 0 ? void 0 : _a.events)
            && this.options.logger
            && this.options.logger(eventName);
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
