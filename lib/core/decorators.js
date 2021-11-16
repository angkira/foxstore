"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = exports.Effect = exports.Reducer = exports.Action = void 0;
require("reflect-metadata");
const ramda_1 = require("ramda");
const setup_1 = require("./setup");
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
        if (typeof eventName === 'string') {
            actions.push(new types_1.MetaAction(eventName, action, options));
        }
        else if (eventName instanceof Array) {
            actions.push(...eventName.map(event => new types_1.MetaAction(event, action, options)));
        }
        Reflect.defineMetadata(types_1.ACTION_METAKEY, actions, store.constructor);
        if (!(options === null || options === void 0 ? void 0 : options.writeAs)) {
            return;
        }
        if (outputEventName) {
            Reducer(outputEventName)(store, `${propertyKey}writeAs`, {
                value: (payload) => (options === null || options === void 0 ? void 0 : options.writeAs) ?
                    (0, ramda_1.assocPath)(options === null || options === void 0 ? void 0 : options.writeAs.split('.'), payload)({})
                    : {}
            });
        }
        else {
            throw new Error('You did not pass outputEventName for Action ' + propertyKey);
        }
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
function Store(initState = Object(), eventScheme, customDispatcher) {
    return function (target = Object) {
        const f = function (...args) {
            Reflect.defineMetadata(types_1.STORE_DECORATED_METAKEY, true, target);
            const newInstance = new target(...args);
            newInstance.eventDispatcher = customDispatcher || newInstance.eventDispatcher;
            (0, setup_1.setupEventsSchemeFromDecorators)(newInstance, eventScheme);
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
