"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = exports.Effect = exports.Reducer = exports.Action = void 0;
require("reflect-metadata");
const helpers_1 = require("../helpers");
const setup_1 = require("./setup");
const types_1 = require("./types");
const writeHandlerByReflectKey = (eventName, options, store, KEY, handler, handlerMetaClass) => {
    const handlers = Reflect.getMetadata(KEY, store.constructor) || [];
    if (typeof eventName === 'string') {
        handlers.push(new handlerMetaClass(eventName, handler, options));
    }
    else if (eventName instanceof Array) {
        handlers.push(...eventName.map(event => new handlerMetaClass(event, handler, options)));
    }
    Reflect.defineMetadata(KEY, handlers, store.constructor);
};
/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
function Action(eventName, options, outputEventName) {
    return function (store, propertyKey, { value: action }) {
        if (!action) {
            return;
        }
        writeHandlerByReflectKey(eventName, options, store, types_1.ACTION_METAKEY, action, types_1.MetaAction);
        if (!options || !options.writeAs) {
            return;
        }
        if (outputEventName) {
            Reducer(outputEventName, { order: 0 })(store, `${propertyKey}writeAs`, {
                value: (0, helpers_1.writeAs)(options === null || options === void 0 ? void 0 : options.writeAs)
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
    return function (store, propertyKey, { value: reducer }) {
        if (!reducer) {
            return;
        }
        writeHandlerByReflectKey(eventName, options, store, types_1.REDUCER_METAKEY, reducer, types_1.MetaReducer);
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
    return function (store, propertyKey, { value: effect }) {
        if (!effect) {
            return;
        }
        writeHandlerByReflectKey(eventName, options, store, types_1.EFFECT_METAKEY, effect, types_1.MetaEffect);
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
