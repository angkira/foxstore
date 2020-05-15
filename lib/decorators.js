"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("./store");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
require("reflect-metadata");
const ramda_1 = require("ramda");
const REDUCER_METAKEY = '@StoreReducers';
const ACTION_METAKEY = '@StoreActions';
const EFFECT_METAKEY = '@StoreEffects';
const simplyReducer = (fieldName) => (payload) => ({ [fieldName]: payload });
/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
class MetaAction {
    constructor(eventName, action, options) {
        this.eventName = eventName;
        this.action = action;
        this.options = options;
    }
}
exports.MetaAction = MetaAction;
/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
class MetaReducer {
    constructor(eventName, reducer, options) {
        this.eventName = eventName;
        this.reducer = reducer;
        this.options = options;
    }
}
exports.MetaReducer = MetaReducer;
/**
 * Side-effects
 *
 * @class MetaEffect
 */
class MetaEffect {
    constructor(eventName, effect, options) {
        this.eventName = eventName;
        this.effect = effect;
        this.options = options;
    }
}
exports.MetaEffect = MetaEffect;
/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
function Action(eventName, options) {
    return function (store, propertyKey, descriptor) {
        const actions = Reflect.getMetadata(ACTION_METAKEY, store.constructor) || [];
        const action = descriptor.value;
        actions.push(new MetaAction(eventName, action, options));
        Reflect.defineMetadata(ACTION_METAKEY, actions, store.constructor);
    };
}
exports.Action = Action;
/**
 * Reducer MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
function Reducer(eventName) {
    return function (store, propertyKey, descriptor) {
        const reducer = descriptor.value;
        const reducers = Reflect.getMetadata(REDUCER_METAKEY, store.constructor) || [];
        reducers.push(new MetaReducer(eventName, reducer));
        Reflect.defineMetadata(REDUCER_METAKEY, reducers, store.constructor);
    };
}
exports.Reducer = Reducer;
/**
 * Effect MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
function Effect(eventName) {
    return function (store, propertyKey, descriptor) {
        const effect = descriptor.value;
        const effects = Reflect.getMetadata(EFFECT_METAKEY, store.constructor) || [];
        effects.push(new MetaEffect(eventName, effect));
        Reflect.defineMetadata(EFFECT_METAKEY, effects, store.constructor);
    };
}
exports.Effect = Effect;
/**
 * Store decorator. Can be used for Injectable services like in Angular
 * Waiting for Decorators will became not "experimental" to work with types correctly.
 * Now, to use Store-class methods you should extend your class from ProtoStore, sorry.
 * I hope that in short time I will find way to use it in simplier way.
 * @export
 * @param {*} [initState]
 * @param {Dispatcher} [customDispatcher]
 * @returns {*}
 */
function Store(initState, customDispatcher, eventScheme = {}) {
    return function (target = Object) {
        // save a reference to the original constructor
        // The new constructor behaviour
        const f = function (...args) {
            // const newInstance = new ProtoStore<typeof initState>(initState);
            // newInstance['__proto__'] = original.prototype;
            const newInstance = new target(...args);
            const constructor = newInstance['__proto__'].constructor;
            newInstance.eventDispatcher = customDispatcher || newInstance.eventDispatcher;
            exports.setupStoreEventsFromDecorators(newInstance, eventScheme);
            // Copy metadata from decorated class to new instance
            Reflect.getMetadataKeys(constructor)
                .forEach((key) => Reflect.defineMetadata(key, Reflect.getMetadata(key, constructor), newInstance));
            return newInstance;
        };
        f.prototype = target['__proto__'];
        return f;
    };
}
exports.Store = Store;
/**
 * Gets Actions, Reducers and Effects from metadata and create EventScheme
 * @param store
 * @param eventScheme
 */
exports.setupStoreEventsFromDecorators = (store, eventScheme = {}) => {
    const effects = Reflect.getMetadata(EFFECT_METAKEY, store.constructor)
        || [];
    const reducers = Reflect.getMetadata(REDUCER_METAKEY, store.constructor)
        || [];
    const actions = Reflect.getMetadata(ACTION_METAKEY, store.constructor)
        || [];
    const metadataEventScheme = eventScheme;
    const entityReducer = (entityName) => (scheme, entity) => {
        scheme[entity.eventName] = scheme[entity.eventName]
            || { [entityName]: [] };
        scheme[entity.eventName][entityName].push(entity);
        return scheme;
    };
    effects.reduce(entityReducer('effects'), metadataEventScheme);
    actions.reduce(entityReducer('actions'), metadataEventScheme);
    reducers.reduce(entityReducer('reducers'), metadataEventScheme);
    exports.setupStoreEvents(metadataEventScheme)(store);
};
/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
exports.setupStoreEvents = (eventScheme = {}) => (newInstance) => {
    const reducerHandler = reducerMetaHandler(newInstance);
    const effectHandler = effectMetaHandler(newInstance);
    const actionHandler = actionMetaHandler(newInstance);
    const handlersMap = {
        reducers: reducerHandler,
        effects: effectHandler,
        actions: actionHandler,
    };
    const entityLists = ramda_1.values(eventScheme)
        .reduce((acc, event) => {
        ramda_1.keys(event)
            .map((key) => {
            acc[key] = (acc[key] || []).concat(event[key]);
        });
        return acc;
    }, {});
    ramda_1.keys(entityLists).forEach((entityType) => ramda_1.forEach(handlersMap[entityType])(entityLists[entityType]));
    return newInstance;
};
/**
 * Just write entity to Store by name
 * @param instance - Store instance
 */
function simplyMetaPatcher(instance) {
    return (event, writeAs, state) => (event.async ?
        event.payload
        : rxjs_1.of(event.payload))
        .subscribe((actionPayload) => instance.patch(simplyReducer(writeAs)
        .call(instance, actionPayload, state)));
}
/**
 * Get event payload
 * @param instance - Store instance
 */
function metaGetEntityPayload({ eventDispatcher, store$ }) {
    return (entity) => eventDispatcher
        .listen(entity.eventName)
        .pipe(
    // tap(x => console.log(x)), // TODO: create Log-plugin to log events. ReduxTools - maybe
    operators_1.mergeMap((event) => (event.async ?
        event.payload
        : rxjs_1.of(event.payload))
        .pipe(operators_1.take(1))), operators_1.withLatestFrom(store$.pipe(operators_1.take(1))), operators_1.shareReplay(1));
}
/**
 * Handler for reducer
 * @param instance
 */
function reducerMetaHandler(instance) {
    return (reducer) => metaGetEntityPayload(instance)(reducer)
        .subscribe(([payload, state]) => instance.patch(reducer.reducer.call(instance, payload, state)));
}
/**
 * Handler for Effect
 * @param instance
 */
function effectMetaHandler(instance) {
    return (effect) => metaGetEntityPayload(instance)(effect)
        .subscribe(([payload, state]) => effect.effect.call(instance, payload, state));
}
/**
 * Handler for Action
 * @param instance
 */
function actionMetaHandler(instance) {
    return (action) => metaGetEntityPayload(instance)(action)
        .subscribe(([payload, state]) => {
        const result = action.action.call(instance, payload, state);
        instance.eventDispatcher.dispatch(result);
        if (action.options && action.options.writeAs) {
            simplyMetaPatcher(instance)(result, action.options.writeAs, state);
        }
    });
}
/**
 * Best way to create Store without classes.
 * Just set eventything and get new Store
 * @param initState - init state where you can set type of every entity in Store
 * @param customDispatcher - custom event dispatcher, if you need connect a few Stores
 * @param options - extra options for Store
 * @param eventScheme - scheme of events and its handlers
 *
 * @deprecated - Now you can give EventScheme to Store conctructor
 */
exports.createStore = (initState, customDispatcher, options, eventScheme) => exports.setupStoreEvents(eventScheme)(new store_1.ProtoStore(initState, options, customDispatcher));
/**
 * Function to fix type-checking of SchemeEvents
 * @param scheme Scheme Object
 */
exports.schemeGen = (scheme) => scheme;
