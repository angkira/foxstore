"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventConfig = exports.HandlerClassMap = exports.MetaEffect = exports.MetaReducer = exports.MetaAction = exports.simplyReducer = exports.HandlerNameList = exports.HandlerName = exports.STORE_DECORATED_METAKEY = exports.EFFECT_METAKEY = exports.ACTION_METAKEY = exports.REDUCER_METAKEY = void 0;
exports.REDUCER_METAKEY = '@StoreReducers';
exports.ACTION_METAKEY = '@StoreActions';
exports.EFFECT_METAKEY = '@StoreEffects';
exports.STORE_DECORATED_METAKEY = '@Store';
var HandlerName;
(function (HandlerName) {
    HandlerName["Action"] = "actions";
    HandlerName["Reducer"] = "reducers";
    HandlerName["Effect"] = "effects";
})(HandlerName = exports.HandlerName || (exports.HandlerName = {}));
exports.HandlerNameList = [
    HandlerName.Action,
    HandlerName.Reducer,
    HandlerName.Effect,
];
const simplyReducer = (fieldName) => 
// @ts-ignore
(payload) => ({ [fieldName]: payload });
exports.simplyReducer = simplyReducer;
/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
class MetaAction {
    constructor(eventName, handler, options) {
        this.eventName = eventName;
        this.handler = handler;
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
    constructor(eventName, handler, options) {
        this.eventName = eventName;
        this.handler = handler;
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
    constructor(eventName, handler, options) {
        this.eventName = eventName;
        this.handler = handler;
        this.options = options;
    }
}
exports.MetaEffect = MetaEffect;
exports.HandlerClassMap = {
    [HandlerName.Action]: MetaAction,
    [HandlerName.Reducer]: MetaReducer,
    [HandlerName.Effect]: MetaEffect,
};
class EventConfig {
    constructor(eventName, config) {
        var _d, _e, _f;
        this[_a] = [];
        this[_b] = [];
        this[_c] = [];
        config &&
            Object.assign(this, {
                [HandlerName.Action]: ((_d = config.actions) === null || _d === void 0 ? void 0 : _d.map(([action, options]) => new MetaAction(eventName, action, options))) || [],
                [HandlerName.Reducer]: ((_e = config.reducers) === null || _e === void 0 ? void 0 : _e.map(([reducer, options]) => new MetaReducer(eventName, reducer, options))) || [],
                [HandlerName.Effect]: ((_f = config.actions) === null || _f === void 0 ? void 0 : _f.map(([effect, options]) => new MetaEffect(eventName, effect, options))) || [],
            });
    }
}
exports.EventConfig = EventConfig;
_a = HandlerName.Action, _b = HandlerName.Reducer, _c = HandlerName.Effect;
