"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoStore = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const ramda_1 = require("ramda");
const dispatcher_1 = require("./dispatcher");
const setup_1 = require("./setup");
const types_1 = require("./types");
require("reflect-metadata");
const options_1 = require("./options");
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template State - type | interface for state of Store
 */
class ProtoStore {
    constructor(initState, eventScheme, options = options_1.DefaultStoreOptions, eventDispatcher = new dispatcher_1.Dispatcher(new dispatcher_1.Event('storeInit', initState))) {
        this.initState = initState;
        this.eventScheme = eventScheme;
        this.options = options;
        this.eventDispatcher = eventDispatcher;
        /**
         * Subject that contains
         *
         * @type {(ReplaySubject<State | {}>)}
         * @memberof ProtoStore
         */
        this.store$ = new rxjs_1.BehaviorSubject({});
        initState && this.patch(initState);
        this.options = Object.assign({}, options_1.DefaultStoreOptions, options);
        !Reflect.getMetadata(types_1.STORE_DECORATED_METAKEY, this.constructor) &&
            (0, setup_1.setupEventsSchemeFromDecorators)(this, eventScheme || {});
        eventScheme && (0, setup_1.setupStoreEvents)(eventScheme)(this);
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
        return (0, rxjs_1.pipe)((0, operators_1.distinctUntilChanged)(), (0, operators_1.takeUntil)(this.eventDispatcher.destroy$), (0, operators_1.shareReplay)(1))(this.store$.pipe((0, operators_1.map)((0, ramda_1.path)([entityName]))));
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
        var _a, _b, _c, _d, _e;
        const patchedState = Object.assign((0, ramda_1.mergeDeepRight)(this.snapshot, update), ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.hashMap) === null || _b === void 0 ? void 0 : _b.on) ?
            this.getHashMap(update) : {});
        this.store$.next(patchedState);
        const logOptions = (_c = this.options) === null || _c === void 0 ? void 0 : _c.logOptions;
        (logOptions === null || logOptions === void 0 ? void 0 : logOptions.logOn)
            && (logOptions === null || logOptions === void 0 ? void 0 : logOptions.state)
            && ((_d = logOptions === null || logOptions === void 0 ? void 0 : logOptions.logger) === null || _d === void 0 ? void 0 : _d.call(logOptions, `${((_e = this.options) === null || _e === void 0 ? void 0 : _e.storeName) || this['constructor'].name} | State updated: `, patchedState));
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
     * Resets the Store state by init state.
     *
     * @memberof ProtoStore
     */
    reset() {
        this.store$.next(this.initState || {});
        return this;
    }
    /**
     * Ethernal method to dispatch Store Event
     * @param eventName
     * @param payload
     */
    dispatch(eventName, payload) {
        var _a, _b, _c, _d;
        ((_a = this.options.logOptions) === null || _a === void 0 ? void 0 : _a.logOn)
            && ((_b = this.options.logOptions) === null || _b === void 0 ? void 0 : _b.events)
            && ((_d = (_c = this.options.logOptions) === null || _c === void 0 ? void 0 : _c.logger) === null || _d === void 0 ? void 0 : _d.call(_c, eventName));
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
            .pipe((options.once ? (0, operators_1.take)(1) : (0, operators_1.map)(ramda_1.identity)))
            .subscribe((event) => callbackFn(event.payload));
        return this;
    }
    /**
     * For every list-entity in state returnes HashMap for easier using
     *
     */
    getHashMap(value) {
        var _a, _b;
        if ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.hashMap) === null || _b === void 0 ? void 0 : _b.on) {
            return Object
                .keys(value)
                .filter((key) => Array.isArray(this.snapshot[key]))
                .map((entityKey) => ({
                name: entityKey,
                // @ts-ignore
                value: (0, ramda_1.indexBy)(
                // @ts-ignore
                (0, ramda_1.prop)(this.options.hashMap.HashMapKey || 'id'))(this.snapshot[entityKey]),
            }))
                .reduce((mapObject, entity) => {
                mapObject[`${entity.name}_Map`] = entity.value;
                return mapObject;
            }, {});
        }
        else {
            return {};
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
