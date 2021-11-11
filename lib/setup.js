"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandlers = exports.setupStoreEvents = exports.setupEventsSchemeFromDecorators = void 0;
const ramda_1 = require("ramda");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const _1 = require(".");
const helpers_1 = require("./helpers");
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
const handlerApplicator = (payloadObject, state, handlers, handlerToApply) => {
    const applyHandler = (0, helpers_1.handleStreamOnce)({
        next: (payload) => handlerToApply(payload, state)(handlers),
    });
    if ((0, rxjs_1.isObservable)(payloadObject)) {
        applyHandler(payloadObject);
        return;
    }
    if (payloadObject instanceof Promise) {
        payloadObject.then((payload) => handlerToApply(payload, state)(handlers));
        return;
    }
    handlerToApply(payloadObject, state)(handlers);
};
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
    const isHandlersList = (0, ramda_1.converge)((v1, v2) => v1 && v2, [(0, ramda_1.flip)(ramda_1.includes)(_1.HandlerNameList), Array.isArray]);
    const filterSchemeHandlers = (predicate) => (scheme) => (0, ramda_1.mapObjIndexed)((eventConfig) => (0, ramda_1.mapObjIndexed)((0, ramda_1.ifElse)(ramda_1.isEmpty, ramda_1.identity, (0, ramda_1.filter)(predicate)), (0, ramda_1.pickBy)(isHandlersList, eventConfig)), scheme);
    const eventSchemeOfSimpleEvents = filterSchemeHandlers(hasNotRequiredEvents)(eventScheme);
    const eventSchemeOfRequiredEvents = filterSchemeHandlers(hasRequiredEvents)(eventScheme);
    const eventSchemeToHandledStreams = (eventScheme) => Object.entries(eventScheme)
        .map(([eventName, eventConfig]) => (0, ramda_1.mapObjIndexed)((0, ramda_1.map)((handler) => {
        var _a, _b;
        return [
            metaGetPayloadForHandler(newInstance)(eventName, (_b = (_a = handler.options) === null || _a === void 0 ? void 0 : _a.requiredEvents) === null || _b === void 0 ? void 0 : _b.eventNames),
            handler,
        ];
    }), eventConfig))
        .flatMap((config) => _1.HandlerNameList.flatMap((handlerName) => config[handlerName].map(([payload$, handler]) => payload$.pipe((0, operators_1.tap)(([payload, state]) => handlerApplicator(payload, state, [handler], handlerParserMap[handlerName]))))));
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
        const requiredEventStreams = (_a = requiredEvents === null || requiredEvents === void 0 ? void 0 : requiredEvents.map((eventName) => store.listen(eventName))) !== null && _a !== void 0 ? _a : [];
        const mainEvent$ = store.listen(eventName);
        const firstValue$ = (0, rxjs_1.iif)(() => !!(requiredEventStreams === null || requiredEventStreams === void 0 ? void 0 : requiredEventStreams.length), (0, rxjs_1.zip)(...requiredEventStreams, mainEvent$).pipe((0, operators_1.map)(streams => (0, ramda_1.last)(streams))), mainEvent$).pipe((0, operators_1.take)(1));
        return ((requiredEventStreams === null || requiredEventStreams === void 0 ? void 0 : requiredEventStreams.length) ?
            (0, rxjs_1.merge)(firstValue$, mainEvent$.pipe((0, operators_1.skipUntil)((0, rxjs_1.zip)(...requiredEventStreams))))
            : mainEvent$).pipe((0, operators_1.map)(event => event === null || event === void 0 ? void 0 : event.payload), (0, operators_1.withLatestFrom)(store.store$.asObservable()), (0, operators_1.shareReplay)(1));
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
            var _a, _b;
            result = Object.assign(result, reducer.reducer.call(instance, payload, result));
            const logOptions = (_a = instance.options) === null || _a === void 0 ? void 0 : _a.logOptions;
            const logString = `REDUCER: ${reducer.reducer.name}`;
            (logOptions === null || logOptions === void 0 ? void 0 : logOptions.logOn) &&
                logOptions.reducers &&
                ((_b = logOptions.logger) === null || _b === void 0 ? void 0 : _b.call(logOptions, logString));
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
        var _a, _b;
        effect.effect.call(instance, payload, state);
        const logOptions = (_a = instance.options) === null || _a === void 0 ? void 0 : _a.logOptions;
        const logString = `EFFECT: ${effect.effect.name}`;
        (logOptions === null || logOptions === void 0 ? void 0 : logOptions.logOn) &&
            logOptions.effects &&
            ((_b = logOptions.logger) === null || _b === void 0 ? void 0 : _b.call(logOptions, logString));
    });
}
/**
 * Handler for Action
 * @param instance
 */
function actionMetaHandler(instance) {
    return (payload, state) => (actions) => actions.forEach(action => {
        var _a, _b;
        const result = action.action.call(instance, payload, state);
        instance.eventDispatcher.dispatch(result);
        const logOptions = (_a = instance.options) === null || _a === void 0 ? void 0 : _a.logOptions;
        const logString = `ACTION: ${action.action.name}`;
        (logOptions === null || logOptions === void 0 ? void 0 : logOptions.logOn) &&
            logOptions.actions &&
            ((_b = logOptions.logger) === null || _b === void 0 ? void 0 : _b.call(logOptions, logString));
    });
}
const createHandlers = (config) => (eventName) => new types_1.EventConfig(eventName, config);
exports.createHandlers = createHandlers;
