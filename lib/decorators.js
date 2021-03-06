"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemeGen = exports.createStore = exports.setupStoreEvents = exports.setupEventsSchemeFromDecorators = exports.Store = exports.Effect = exports.Reducer = exports.Action = void 0;
const store_1 = require("./store");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
require("reflect-metadata");
const ramda_1 = require("ramda");
const types_1 = require("./types");
/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
function Action(eventName, options, outputEventName) {
    return function (store, propertyKey, descriptor) {
        const actions = Reflect.getMetadata(types_1.ACTION_METAKEY, store.constructor) || [];
        const action = descriptor.value;
        if (options === null || options === void 0 ? void 0 : options.writeAs) {
            if (outputEventName) {
                Reducer(outputEventName)(store, `${propertyKey}writeAs`, { value: (payload) => ramda_1.assocPath(options === null || options === void 0 ? void 0 : options.writeAs.split('.'), payload)({}) });
            }
            else {
                throw new Error('You did not pass outputEventName for Action ' + propertyKey);
            }
        }
        if (typeof eventName === 'string') {
            actions.push(new types_1.MetaAction(eventName, action, options));
        }
        else if (eventName instanceof Array) {
            actions.push(...eventName.map(event => new types_1.MetaAction(event, action, options)));
        }
        Reflect.defineMetadata(types_1.ACTION_METAKEY, actions, store.constructor);
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
function Reducer(eventName, options) {
    return function (store, propertyKey, descriptor) {
        const reducer = descriptor.value;
        const reducers = Reflect.getMetadata(types_1.REDUCER_METAKEY, store.constructor) || [];
        if (typeof eventName === 'string') {
            reducers.push(new types_1.MetaReducer(eventName, reducer, options));
        }
        else if (eventName === null || eventName === void 0 ? void 0 : eventName.length) {
            eventName.forEach(event => reducers.push(new types_1.MetaReducer(event, reducer, options)));
        }
        Reflect.defineMetadata(types_1.REDUCER_METAKEY, reducers, store.constructor);
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
function Effect(eventName, options) {
    return function (store, propertyKey, descriptor) {
        const effect = descriptor.value;
        const effects = Reflect.getMetadata(types_1.EFFECT_METAKEY, store.constructor) || [];
        if (typeof eventName === 'string') {
            effects.push(new types_1.MetaEffect(eventName, effect, options));
        }
        else if (eventName === null || eventName === void 0 ? void 0 : eventName.length) {
            eventName.forEach(event => effects.push(new types_1.MetaEffect(event, effect, options)));
        }
        Reflect.defineMetadata(types_1.EFFECT_METAKEY, effects, store.constructor);
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
function Store(initState = Object(), customDispatcher, eventScheme = {}) {
    return function (target = Object) {
        // save a reference to the original constructor
        // The new constructor behaviour
        const f = function (...args) {
            // const newInstance = new ProtoStore<typeof initState>(initState);
            // newInstance['__proto__'] = original.prototype;
            Reflect.defineMetadata(types_1.STORE_DECORATED_METAKEY, true, target);
            const newInstance = new target(...args);
            newInstance.eventDispatcher = customDispatcher || newInstance.eventDispatcher;
            exports.setupEventsSchemeFromDecorators(newInstance, eventScheme);
            // Copy metadata from decorated class to new instance
            Reflect.getMetadataKeys(target)
                .forEach((key) => Reflect.defineMetadata(key, Reflect.getMetadata(key, target), newInstance));
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
const setupEventsSchemeFromDecorators = (store, eventScheme = {}) => {
    const effects = Reflect.getMetadata(types_1.EFFECT_METAKEY, store.constructor)
        || [];
    const reducers = Reflect.getMetadata(types_1.REDUCER_METAKEY, store.constructor)
        || [];
    const actions = Reflect.getMetadata(types_1.ACTION_METAKEY, store.constructor)
        || [];
    const metadataEventScheme = eventScheme;
    const entityReducer = (entityName) => (scheme, entity) => {
        var _a, _b;
        scheme[_a = entity.eventName] || (scheme[_a] = { [entityName]: [] });
        (_b = scheme[entity.eventName])[entityName] || (_b[entityName] = []);
        scheme[entity.eventName][entityName].push(entity);
        return scheme;
    };
    effects.reduce(entityReducer('effects'), metadataEventScheme);
    actions.reduce(entityReducer('actions'), metadataEventScheme);
    reducers.reduce(entityReducer('reducers'), metadataEventScheme);
    store.eventScheme = metadataEventScheme;
};
exports.setupEventsSchemeFromDecorators = setupEventsSchemeFromDecorators;
/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
const setupStoreEvents = (eventScheme = {}) => (newInstance) => {
    const reducerHandler = reducerMetaHandler(newInstance);
    const effectHandler = effectMetaHandler(newInstance);
    const actionHandler = actionMetaHandler(newInstance);
    const actionAsyncHandler = (payloadObject, state, actions) => rxjs_1.isObservable(payloadObject) ?
        payloadObject
            .pipe(operators_1.take(1))
            .subscribe(payload => actionHandler(payload, state)(actions))
        : actionHandler(payloadObject, state)(actions);
    const isEventHasRequiredEvents = (entity) => { var _a; return !!((_a = entity.options) === null || _a === void 0 ? void 0 : _a.requiredEvents); };
    const isEventHasNotRequiredEvents = ramda_1.complement(isEventHasRequiredEvents);
    const eventSchemeOfSimpleEvents = ramda_1.mapObjIndexed(ramda_1.mapObjIndexed(ramda_1.filter(isEventHasNotRequiredEvents)))(eventScheme);
    const eventSchemeOfRequiredEvents = ramda_1.mapObjIndexed(ramda_1.mapObjIndexed(ramda_1.filter(isEventHasRequiredEvents)))(eventScheme);
    const streamsWithRequiredEvents = Object.entries(eventSchemeOfRequiredEvents)
        .map(([eventName, eventConfig]) => ramda_1.mapObjIndexed(ramda_1.map((entity) => {
        var _a, _b;
        return [
            metaGetEntityPayload(newInstance)(eventName, (_b = (_a = entity.options) === null || _a === void 0 ? void 0 : _a.requiredEvents) === null || _b === void 0 ? void 0 : _b.eventNames),
            entity,
        ];
    }))(eventConfig))
        .flatMap(({ actions, reducers, effects }) => [
        ...(actions || []).map(([payload$, action]) => payload$.pipe(operators_1.tap(payload => actionAsyncHandler(...payload, [action])))),
        ...(reducers || []).map(([payload$, reducer]) => payload$.pipe(operators_1.tap(payload => reducerHandler(...payload)([reducer])))),
        ...(effects || []).map(([payload$, effect]) => payload$.pipe(operators_1.tap(payload => effectHandler(...payload)([effect])))),
    ]);
    const payloadStreams = ramda_1.keys(eventSchemeOfSimpleEvents)
        .filter(eventName => Object.values(eventSchemeOfSimpleEvents[eventName])
        .some(ramda_1.complement(ramda_1.isEmpty)))
        .map((eventName) => metaGetEntityPayload(newInstance)(eventName).pipe(operators_1.tap(([payloadObject, state]) => {
        var _a, _b, _c, _d;
        const logger = (((_a = newInstance.options) === null || _a === void 0 ? void 0 : _a.logOn)
            && ((_c = (_b = newInstance.options) === null || _b === void 0 ? void 0 : _b.logOptions) === null || _c === void 0 ? void 0 : _c.events)
            && ((_d = newInstance.options) === null || _d === void 0 ? void 0 : _d.logger)) || rxjs_1.noop;
        logger({
            event: eventName,
            payload: payloadObject
        });
        const { actions, reducers, effects } = eventSchemeOfSimpleEvents[eventName];
        if (reducers instanceof Array
            && (reducers === null || reducers === void 0 ? void 0 : reducers.length)) {
            reducerHandler(payloadObject, state)(reducers);
        }
        if (effects instanceof Array
            && (effects === null || effects === void 0 ? void 0 : effects.length)) {
            effectHandler(payloadObject, state)(effects);
        }
        if (actions instanceof Array
            && (actions === null || actions === void 0 ? void 0 : actions.length)) {
            actionAsyncHandler(payloadObject, state, actions);
        }
    })));
    rxjs_1.merge(...payloadStreams, ...streamsWithRequiredEvents).pipe(operators_1.takeUntil(newInstance.eventDispatcher.destroy$)).subscribe();
    return newInstance;
};
exports.setupStoreEvents = setupStoreEvents;
/**
 * Get event payload
 * @param instance - Store instance
 */
function metaGetEntityPayload({ eventDispatcher, store$ }) {
    return (eventName, requiredEvents) => {
        const requiredEventStreams = requiredEvents === null || requiredEvents === void 0 ? void 0 : requiredEvents.map(eventName => eventDispatcher.listen(eventName));
        return rxjs_1.combineLatest([
            ((requiredEventStreams === null || requiredEventStreams === void 0 ? void 0 : requiredEventStreams.length) ?
                rxjs_1.merge(
                // For first value emitting
                rxjs_1.zip(...requiredEventStreams, eventDispatcher.listen(eventName)).pipe(operators_1.take(1), operators_1.map(ramda_1.last)), 
                // Waiting for Required Events emitted
                eventDispatcher
                    .listen(eventName)
                    .pipe(operators_1.skipUntil(rxjs_1.zip(...requiredEventStreams))))
                : eventDispatcher
                    .listen(eventName)).pipe(operators_1.shareReplay(1), operators_1.mergeMap((event) => (event.async ?
                event.payload
                : rxjs_1.of(event.payload))
                .pipe(operators_1.take(1))), operators_1.share()),
            store$.pipe(operators_1.take(1)),
        ]);
    };
}
/**
 * Handler for reducer
 * @param instance
 */
function reducerMetaHandler(instance) {
    return (payload, state) => (reducers) => {
        let result = state;
        reducers.forEach(reducer => {
            var _a;
            result = Object.assign(result, reducer.reducer.call(instance, payload, result));
            instance.options.logOn && instance.options.logger
                && ((_a = instance.options.logOptions) === null || _a === void 0 ? void 0 : _a.reducers)
                && instance.options.logger(`REDUCER: ${reducer.reducer.name}`);
        });
        instance.patch(result);
    };
}
/**
 * Handler for Effect
 * @param instance
 */
function effectMetaHandler(instance) {
    return (payload, state) => (effects) => effects.forEach(effect => {
        var _a;
        effect.effect.call(instance, payload, state);
        instance.options.logOn && instance.options.logger
            && ((_a = instance.options.logOptions) === null || _a === void 0 ? void 0 : _a.effects)
            && instance.options.logger(`EFFECT: ${effect.effect.name}`);
    });
}
/**
 * Handler for Action
 * @param instance
 */
function actionMetaHandler(instance) {
    return (payload, state) => (actions) => actions.forEach(action => {
        var _a;
        const result = action.action.call(instance, payload, state);
        instance.eventDispatcher.dispatch(result);
        instance.options.logOn && instance.options.logger
            && ((_a = instance.options.logOptions) === null || _a === void 0 ? void 0 : _a.actions)
            && instance.options.logger(`ACTION: ${action.action.name}`);
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
const createStore = (initState, customDispatcher, options, eventScheme) => exports.setupStoreEvents(eventScheme)(new store_1.ProtoStore(initState, options, customDispatcher));
exports.createStore = createStore;
/**
 * Function to fix type-checking of SchemeEvents
 * @param scheme Scheme Object
 */
const schemeGen = (scheme) => scheme;
exports.schemeGen = schemeGen;
