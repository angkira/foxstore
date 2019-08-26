"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
require("reflect-metadata");
const REDUCER_METAKEY = '@StoreReducers';
const ACTION_METAKEY = '@StoreActions';
const EFFECT_METAKEY = '@StoreEffects';
const simplyReducer = (fieldName) => (payload, state) => ({ [fieldName]: payload });
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
function Store(initState, customDispatcher) {
    return function (target) {
        // save a reference to the original constructor
        const original = target;
        // The new constructor behaviour
        const f = function (...args) {
            // const newInstance = new ProtoStore<typeof initState>(initState);
            // newInstance['__proto__'] = original.prototype;
            const newInstance = new original(...args);
            const dispatcher = customDispatcher ||
                Reflect.get(newInstance, 'dispatcher');
            const state$ = Reflect.get(newInstance, 'state$');
            const effects = Reflect.getMetadata(EFFECT_METAKEY, target)
                || [];
            const reducers = Reflect.getMetadata(REDUCER_METAKEY, target)
                || [];
            const actions = Reflect.getMetadata(ACTION_METAKEY, target)
                || [];
            const getEntityPayload = (entity) => dispatcher
                .listen(entity.eventName)
                .pipe(
            // tap(x => console.log(x)), // TODO: create Log-plugin to log events. ReduxTools - maybe
            operators_1.mergeMap((event) => (event.async ?
                event.payload
                : rxjs_1.of(event.payload))
                .pipe(operators_1.take(1))), operators_1.withLatestFrom(state$.pipe(operators_1.take(1))), operators_1.shareReplay(1));
            const reducerHandler = (reducer) => getEntityPayload(reducer)
                .subscribe(([payload, state]) => newInstance.patch(reducer.reducer.call(newInstance, payload, state)));
            const effectHandler = (effect) => getEntityPayload(effect)
                .subscribe(([payload, state]) => effect.effect.call(newInstance, payload, state));
            const simplyPatcher = (event, writeAs, state) => (event.async ?
                event.payload
                : rxjs_1.of(event.payload))
                .subscribe((actionPayload) => newInstance.patch(simplyReducer(writeAs)
                .call(newInstance, actionPayload, state)));
            const actionHandler = (action) => getEntityPayload(action)
                .subscribe(([payload, state]) => {
                const result = action.action.call(newInstance, payload, state);
                dispatcher.dispatch(result);
                if (action.options && action.options.writeAs) {
                    simplyPatcher(result, action.options.writeAs, state);
                }
            });
            effects.forEach(effectHandler);
            reducers.forEach(reducerHandler);
            actions.forEach(actionHandler);
            return newInstance;
        };
        f.prototype = original['__proto__'];
        return f;
    };
}
exports.Store = Store;
