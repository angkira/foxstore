"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandlers = exports.schemeGen = exports.setupStoreEvents = exports.setupEventsSchemeFromDecorators = void 0;
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
/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
const setupStoreEvents = (eventScheme) => (newInstance) => {
    const reducerHandler = reducerMetaHandler(newInstance);
    const effectHandler = effectMetaHandler(newInstance);
    const actionHandler = actionMetaHandler(newInstance);
    const actionAsyncHandler = (payloadObject, state, actions) => {
        const applyAction = (0, helpers_1.handleStreamOnce)({
            next: (payload) => actionHandler(payload, state)(actions),
        });
        if ((0, rxjs_1.isObservable)(payloadObject)) {
            applyAction(payloadObject);
            return;
        }
        if (payloadObject instanceof Promise) {
            applyAction((0, rxjs_1.from)(payloadObject));
            return;
        }
        actionHandler(payloadObject, state)(actions);
    };
    const isEventHasRequiredEvents = (handler) => { var _a; return !!((_a = handler.options) === null || _a === void 0 ? void 0 : _a.requiredEvents); };
    const isEventHasNotRequiredEvents = (0, ramda_1.complement)(isEventHasRequiredEvents);
    const eventSchemeOfSimpleEvents = (0, ramda_1.mapObjIndexed)((0, ramda_1.mapObjIndexed)((0, ramda_1.filter)(isEventHasNotRequiredEvents)))(eventScheme);
    const eventSchemeOfRequiredEvents = (0, ramda_1.mapObjIndexed)((0, ramda_1.mapObjIndexed)((0, ramda_1.filter)(isEventHasRequiredEvents)))(eventScheme);
    const streamsWithRequiredEvents = Object.entries(eventSchemeOfRequiredEvents)
        .map(([eventName, eventConfig]) => (0, ramda_1.mapObjIndexed)((0, ramda_1.map)((handler) => {
        var _a, _b;
        return [
            metaGetPayloadForHandler(newInstance)(eventName, (_b = (_a = handler.options) === null || _a === void 0 ? void 0 : _a.requiredEvents) === null || _b === void 0 ? void 0 : _b.eventNames),
            handler,
        ];
    }))(eventConfig))
        .flatMap(({ actions, reducers, effects }) => [
        ...(actions || []).map(([payload$, action]) => payload$.pipe((0, operators_1.tap)((payload) => actionAsyncHandler(...payload, [action])))),
        ...(reducers || []).map(([payload$, reducer]) => payload$.pipe((0, operators_1.tap)((payload) => reducerHandler(...payload)([reducer])))),
        ...(effects || []).map(([payload$, effect]) => payload$.pipe((0, operators_1.tap)((payload) => effectHandler(...payload)([effect])))),
    ]);
    const payloadStreams = (0, ramda_1.keys)(eventSchemeOfSimpleEvents)
        .filter((eventName) => Object.values(eventSchemeOfSimpleEvents[eventName]).some((0, ramda_1.complement)(ramda_1.isEmpty)))
        .map((eventName) => metaGetPayloadForHandler(newInstance)(eventName).pipe((0, operators_1.tap)(([payloadObject, state]) => {
        var _a, _b, _c, _d, _e, _f;
        const logger = (((_b = (_a = newInstance.options) === null || _a === void 0 ? void 0 : _a.logOptions) === null || _b === void 0 ? void 0 : _b.logOn) &&
            ((_d = (_c = newInstance.options) === null || _c === void 0 ? void 0 : _c.logOptions) === null || _d === void 0 ? void 0 : _d.events) &&
            ((_f = (_e = newInstance.options) === null || _e === void 0 ? void 0 : _e.logOptions) === null || _f === void 0 ? void 0 : _f.logger)) ||
            rxjs_1.noop;
        logger({
            event: eventName,
            payload: payloadObject,
        });
        const { actions, reducers, effects } = eventSchemeOfSimpleEvents[eventName];
        if (reducers instanceof Array && (reducers === null || reducers === void 0 ? void 0 : reducers.length)) {
            reducerHandler(payloadObject, state)(reducers);
        }
        if (effects instanceof Array && (effects === null || effects === void 0 ? void 0 : effects.length)) {
            effectHandler(payloadObject, state)(effects);
        }
        if (actions instanceof Array && (actions === null || actions === void 0 ? void 0 : actions.length)) {
            actionAsyncHandler(payloadObject, state, actions);
        }
    })));
    (0, rxjs_1.merge)(...payloadStreams, ...streamsWithRequiredEvents)
        .pipe((0, operators_1.takeUntil)(newInstance.eventDispatcher.destroy$))
        .subscribe();
    return newInstance;
};
exports.setupStoreEvents = setupStoreEvents;
/**
 * Get event payload
 * @param instance - Store instance
 */
function metaGetPayloadForHandler({ eventDispatcher, store$, }) {
    return (eventName, requiredEvents) => {
        const requiredEventStreams = requiredEvents === null || requiredEvents === void 0 ? void 0 : requiredEvents.map((eventName) => eventDispatcher.listen(eventName));
        return (0, rxjs_1.combineLatest)([
            ((requiredEventStreams === null || requiredEventStreams === void 0 ? void 0 : requiredEventStreams.length)
                ? (0, rxjs_1.merge)(
                // For first value emitting
                (0, rxjs_1.zip)(...requiredEventStreams, eventDispatcher.listen(eventName)).pipe((0, operators_1.take)(1), (0, operators_1.map)(ramda_1.last)), 
                // Waiting for Required Events emitted
                eventDispatcher
                    .listen(eventName)
                    .pipe((0, operators_1.skipUntil)((0, rxjs_1.zip)(...requiredEventStreams))))
                : eventDispatcher.listen(eventName)).pipe((0, operators_1.shareReplay)(1), (0, operators_1.mergeMap)(({ payload }) => (payload instanceof Promise || (0, rxjs_1.isObservable)(payload)
                ? (0, rxjs_1.from)(payload)
                : (0, rxjs_1.of)(payload)).pipe((0, operators_1.take)(1))), (0, operators_1.share)()),
            store$.pipe((0, operators_1.take)(1)),
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
        reducers.forEach((reducer) => {
            var _a, _b, _c, _d, _e;
            result = Object.assign(result, reducer.reducer.call(instance, payload, result));
            ((_b = (_a = instance.options) === null || _a === void 0 ? void 0 : _a.logOptions) === null || _b === void 0 ? void 0 : _b.logOn) &&
                ((_c = instance.options.logOptions) === null || _c === void 0 ? void 0 : _c.reducers) &&
                ((_e = (_d = instance.options.logOptions).logger) === null || _e === void 0 ? void 0 : _e.call(_d, `REDUCER: ${reducer.reducer.name}`));
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
        var _a, _b, _c, _d;
        effect.effect.call(instance, payload, state);
        ((_b = (_a = instance.options) === null || _a === void 0 ? void 0 : _a.logOptions) === null || _b === void 0 ? void 0 : _b.logOn) &&
            instance.options.logOptions.effects &&
            ((_d = (_c = instance.options.logOptions).logger) === null || _d === void 0 ? void 0 : _d.call(_c, `EFFECT: ${effect.effect.name}`));
    });
}
/**
 * Handler for Action
 * @param instance
 */
function actionMetaHandler(instance) {
    return (payload, state) => (actions) => actions.forEach((action) => {
        var _a, _b, _c, _d;
        const result = action.action.call(instance, payload, state);
        instance.eventDispatcher.dispatch(result);
        ((_b = (_a = instance.options) === null || _a === void 0 ? void 0 : _a.logOptions) === null || _b === void 0 ? void 0 : _b.logOn) &&
            instance.options.logOptions.actions &&
            ((_d = (_c = instance.options.logOptions).logger) === null || _d === void 0 ? void 0 : _d.call(_c, `ACTION: ${action.action.name}`));
    });
}
/**
 * Function to fix type-checking of SchemeEvents
 * @param scheme Scheme Object
 */
const schemeGen = (scheme) => scheme;
exports.schemeGen = schemeGen;
const HandlerClassMap = {
    actions: types_1.MetaAction,
    reducers: types_1.MetaReducer,
    effects: types_1.MetaEffect,
};
const createHandlers = (config) => (eventName) => new types_1.EventConfig(eventName, config);
exports.createHandlers = createHandlers;
// [eventName]: mapObjIndexed(
//     (handlers: [HandlerFn, EventHandlerOptions][], handlerName: HandlerName) =>
//         handlers.map(([handlerFn, options]) =>
//             new HandlerClassMap[handlerName](eventName as string, handlerFn, options)))
//     (config)
