"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoStore = void 0;
require("reflect-metadata");
const ramda_1 = require("ramda");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const saver_1 = require("../saving/saver");
const dispatcher_1 = require("./dispatcher");
const options_1 = require("./options");
const setup_1 = require("./setup");
const types_1 = require("./types");
const helpers_1 = require("../helpers");
const redux_devtools_plugin_1 = require("./redux-devtools.plugin");
/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template State - type | interface for state of Store
 */
class ProtoStore {
    constructor(initState, eventScheme, options, eventDispatcher) {
        var _a, _b, _c;
        if (options === void 0) { options = options_1.DefaultStoreOptions; }
        if (eventDispatcher === void 0) { eventDispatcher = new dispatcher_1.Dispatcher(new dispatcher_1.FoxEvent('storeInit', initState), (_a = options.dispatcher) === null || _a === void 0 ? void 0 : _a.scheduler); }
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
        !Reflect.getMetadata(types_1.STORE_DECORATED_METAKEY, this.constructor) &&
            (0, setup_1.setupEventsSchemeFromDecorators)(this, eventScheme || {});
        eventScheme && !(0, ramda_1.isEmpty)(eventScheme)
            && (0, setup_1.setupStoreEvents)(eventScheme)(this);
        ((_b = options.saving) === null || _b === void 0 ? void 0 : _b.saver) && this.initSaving();
        ((_c = options.logOptions) === null || _c === void 0 ? void 0 : _c.reduxDevTools) && (0, redux_devtools_plugin_1.setupReduxDevtoolsBinding)(initState, this);
    }
    initSaving() {
        var _a;
        const SaverClass = (_a = this.options.saving) === null || _a === void 0 ? void 0 : _a.saver;
        SaverClass && (0, saver_1.InitSaver)(this)(SaverClass);
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
     * Selecting the whole stream with data from Store.
     *
     * @returns {Observable<State | {}>}
     * @memberof ProtoStore
     */
    selectAll() {
        return (0, rxjs_1.pipe)((0, operators_1.distinctUntilChanged)(), (0, operators_1.takeUntil)(this.eventDispatcher.destroy$), (0, operators_1.shareReplay)(1))(this.store$.asObservable());
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
        var _a, _b, _c;
        const oldValue = this.snapshot;
        const patchedState = Object.assign(
        //       mergeDeepRight<State, Partial<State>>(this.snapshot, update),
        (0, helpers_1.deepMerge)(this.snapshot, update), 
        // Object.assign({}, oldValue, update),
        ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.hashMap) === null || _b === void 0 ? void 0 : _b.on) ? this.getHashMap(update) : {});
        this.store$.next(patchedState);
        const storeName = `${String(((_c = this.options) === null || _c === void 0 ? void 0 : _c.storeName) || this['constructor'].name)}`;
        this.log({
            storeName,
            update,
            patchedState,
            oldValue,
        }, 'state');
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
    // dispatch<Payload>(event: FoxEvent<Payload>): this;
    dispatch(event, payload) {
        if (event instanceof dispatcher_1.FoxEvent) {
            this.eventDispatcher.dispatch(event);
            this.log(event, 'events');
        }
        else {
            this.eventDispatcher.dispatch(new dispatcher_1.FoxEvent(event, payload));
            this.log({
                name: event,
                payload,
            }, 'events');
        }
        return this;
    }
    /**
     *
     * @param eventNames names of events to listen
     * @returns Observable which emits only passed Events
     */
    listen(...eventNames) {
        return this.eventDispatcher.listen(...eventNames);
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
            .pipe(options.once ? (0, operators_1.take)(1) : (0, operators_1.map)(ramda_1.identity))
            .subscribe((event) => callbackFn(event.payload));
        return this;
    }
    /**
     * Method to destroy this Store and all subscriptions connected to it.
     *
     * @memberof ProtoStore
     */
    destroy() {
        this.eventDispatcher.emitDestroy();
    }
    /**
     * For every list-entity in state returnes HashMap for easier using
     *
     */
    getHashMap(value) {
        var _a, _b;
        if ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.hashMap) === null || _b === void 0 ? void 0 : _b.on) {
            return Object.keys(value)
                .filter((key) => Array.isArray(this.snapshot[key]))
                .map((entityKey) => ({
                name: entityKey,
                // @ts-ignore
                value: (0, ramda_1.indexBy)(
                // @ts-ignore
                (0, ramda_1.prop)(this.options.hashMap.HashMapKey || 'id'))(this.snapshot[entityKey]),
            }))
                .reduce((mapObject, entity) => {
                mapObject[`${String(entity.name)}_Map`] = entity.value;
                return mapObject;
            }, {});
        }
        else {
            return {};
        }
    }
    log(entity, type) {
        var _a;
        const logOptions = this.options.logOptions;
        if ((logOptions === null || logOptions === void 0 ? void 0 : logOptions.logOn) && logOptions[type]) {
            (_a = logOptions.logger) === null || _a === void 0 ? void 0 : _a.call(logOptions, `${type.toUpperCase()}: `, entity);
        }
        return this;
    }
}
exports.ProtoStore = ProtoStore;
