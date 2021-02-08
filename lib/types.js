"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaEffect = exports.MetaReducer = exports.MetaAction = exports.simplyReducer = exports.STORE_DECORATED_METAKEY = exports.EFFECT_METAKEY = exports.ACTION_METAKEY = exports.REDUCER_METAKEY = void 0;
exports.REDUCER_METAKEY = '@StoreReducers';
exports.ACTION_METAKEY = '@StoreActions';
exports.EFFECT_METAKEY = '@StoreEffects';
exports.STORE_DECORATED_METAKEY = '@Store';
const simplyReducer = (fieldName) => (payload) => ({ [fieldName]: payload });
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
