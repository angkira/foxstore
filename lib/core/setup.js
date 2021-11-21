"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandlers = exports.setupStoreEvents = exports.setupEventsSchemeFromDecorators = void 0;
const ramda_1 = require("ramda");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const helpers_1 = require("../helpers");
const _1 = require("./");
const types_1 = require("./types");
/**
 * Gets Actions, Reducers and Effects from metadata and create EventScheme
 * @param store
 * @param eventScheme
 */
const setupEventsSchemeFromDecorators = (store, eventScheme) => {
    const effects = Reflect.getMetadata(types_1.EFFECT_METAKEY, store.constructor) || [];
    const reducers = Reflect.getMetadata(types_1.REDUCER_METAKEY, store.constructor) || [];
    const actions = Reflect.getMetadata(types_1.ACTION_METAKEY, store.constructor) || [];
    const metadataEventScheme = eventScheme;
    const handlerReducerByType = (handlerName) => (scheme, handler) => {
        var _a, _b;
        scheme[_a = handler.eventName] || (scheme[_a] = { [handlerName]: [] });
        (_b = scheme[handler.eventName])[handlerName] || (_b[handlerName] = []);
        scheme[handler.eventName][handlerName].push(handler);
        return scheme;
    };
    effects.reduce(handlerReducerByType(_1.HandlerName.Effect), metadataEventScheme);
    actions.reduce(handlerReducerByType(_1.HandlerName.Action), metadataEventScheme);
    reducers.reduce(handlerReducerByType(_1.HandlerName.Reducer), metadataEventScheme);
    store.eventScheme = metadataEventScheme;
};
exports.setupEventsSchemeFromDecorators = setupEventsSchemeFromDecorators;
const handlerApplicator = (payloadObject, state, handlers, handlerToApply) => (0, helpers_1.applyCallbackToMaybeAsync)((payload) => handlerToApply(payload, state)(handlers))(payloadObject);
/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
const setupStoreEvents = (eventScheme) => (newInstance) => {
    const handlerParserMap = {
        [_1.HandlerName.Action]: actionMetaHandler(newInstance),
        [_1.HandlerName.Reducer]: reducerMetaHandler(newInstance),
        [_1.HandlerName.Effect]: effectMetaHandler(newInstance),
    };
    const hasRequiredEvents = (handler) => { var _a; return !!((_a = handler.options) === null || _a === void 0 ? void 0 : _a.requiredEvents); };
    const hasNotRequiredEvents = (0, ramda_1.complement)(hasRequiredEvents);
    const filterSchemeHandlers = (predicate) => (scheme) => (0, ramda_1.mapObjIndexed)((eventConfig) => (0, ramda_1.mapObjIndexed)((0, ramda_1.ifElse)(ramda_1.isEmpty, ramda_1.identity, (0, ramda_1.filter)(predicate)), (0, ramda_1.pick)(_1.HandlerNameList)(eventConfig)), scheme);
    const eventSchemeOfSimpleEvents = filterSchemeHandlers(hasNotRequiredEvents)(eventScheme);
    const eventSchemeOfRequiredEvents = filterSchemeHandlers(hasRequiredEvents)(eventScheme);
    const eventSchemeToHandledStreams = (eventScheme) => Object.entries(eventScheme)
        .map(([eventName, eventConfig]) => (0, ramda_1.mapObjIndexed)((0, ramda_1.map)((handler) => {
        var _a;
        return [
            metaGetPayloadForHandler(newInstance)(eventName, (_a = handler.options) === null || _a === void 0 ? void 0 : _a.requiredEvents),
            handler,
        ];
    }), eventConfig))
        .flatMap((config) => _1.HandlerNameList.flatMap((handlerName) => config[handlerName]
        ? config[handlerName].map(([payload$, handler]) => payload$.pipe((0, operators_1.tap)(([payload, state]) => handlerApplicator(payload, state, [handler], handlerParserMap[handlerName]))))
        : []));
    const payloadStreams = [
        eventSchemeOfSimpleEvents,
        eventSchemeOfRequiredEvents,
    ].flatMap(eventSchemeToHandledStreams);
    (0, rxjs_1.merge)(...payloadStreams)
        .pipe((0, operators_1.takeUntil)(newInstance.eventDispatcher.destroy$))
        .subscribe();
    return newInstance;
};
exports.setupStoreEvents = setupStoreEvents;
/**
 * Get event payload
 * @param instance - Store instance
 */
function metaGetPayloadForHandler(store) {
    return (eventName, requiredEvents) => {
        var _a;
        const mainEvent$ = store.listen(eventName);
        const extendByState = (0, rxjs_1.pipe)((0, operators_1.map)((event) => event === null || event === void 0 ? void 0 : event.payload), (0, operators_1.withLatestFrom)(store.store$.asObservable()), (0, operators_1.shareReplay)(1));
        if ((_a = requiredEvents === null || requiredEvents === void 0 ? void 0 : requiredEvents.eventNames) === null || _a === void 0 ? void 0 : _a.length) {
            const requiredEventsStreams = requiredEvents === null || requiredEvents === void 0 ? void 0 : requiredEvents.eventNames.map(eventName => store.listen(eventName));
            const requiredEvents$ = (0, rxjs_1.zip)(...requiredEventsStreams);
            const guardedEvent$ = (0, rxjs_1.zip)(requiredEvents$, mainEvent$).pipe((0, operators_1.map)((streams) => (0, ramda_1.last)(streams)));
            return extendByState((0, rxjs_1.merge)(guardedEvent$.pipe((0, operators_1.take)(1)), ((requiredEvents === null || requiredEvents === void 0 ? void 0 : requiredEvents.always)
                ? guardedEvent$.pipe((0, operators_1.skip)(1))
                : mainEvent$)));
        }
        return extendByState(mainEvent$);
    };
}
/**
 * Handler for reducer
 * @param instance
 */
function reducerMetaHandler(instance) {
    return (payload, state) => (reducers) => {
        let result = state;
        reducers.forEach((reducer) => {
            result = Object.assign(result, reducer.handler.call(instance, payload, result));
            instance.log(reducer.handler.name, _1.HandlerName.Reducer);
        });
        instance.patch(result);
    };
}
/**
 * Handler for Effect
 * @param instance
 */
function effectMetaHandler(instance) {
    return (payload, state) => (effects) => effects.forEach((effect) => {
        effect.handler.call(instance, payload, state);
        instance.log(effect.handler.name, _1.HandlerName.Effect);
    });
}
/**
 * Handler for Action
 * @param instance
 */
function actionMetaHandler(instance) {
    return (payload, state) => (actions) => actions.forEach((action) => {
        const result = action.handler.call(instance, payload, state);
        instance.eventDispatcher.dispatch(result);
        instance.log(action.handler.name, _1.HandlerName.Action);
    });
}
const createHandlers = (config) => (eventName) => new types_1.EventConfig(eventName, config);
exports.createHandlers = createHandlers;
