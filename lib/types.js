"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventConfig = exports.MetaEffect = exports.MetaReducer = exports.MetaAction = exports.simplyReducer = exports.HandlerName = exports.STORE_DECORATED_METAKEY = exports.EFFECT_METAKEY = exports.ACTION_METAKEY = exports.REDUCER_METAKEY = void 0;
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
;
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
class EventConfig {
    constructor(eventName, config) {
        var _a, _b, _c;
        config && Object.assign(this, {
            [HandlerName.Action]: (_a = config.actions) === null || _a === void 0 ? void 0 : _a.map(([action, options]) => new MetaAction(eventName, action, options)),
            [HandlerName.Reducer]: (_b = config.reducers) === null || _b === void 0 ? void 0 : _b.map(([reducer, options]) => new MetaReducer(eventName, reducer, options)),
            [HandlerName.Effect]: (_c = config.actions) === null || _c === void 0 ? void 0 : _c.map(([effect, options]) => new MetaEffect(eventName, effect, options)),
        });
    }
}
exports.EventConfig = EventConfig;
;
