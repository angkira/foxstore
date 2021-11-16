"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapObject = exports.applyCallbackToMaybeAsync = exports.handleStreamOnce = void 0;
const rxjs_1 = require("rxjs");
const handleStreamOnce = (observer) => (stream$) => stream$.pipe((0, rxjs_1.take)(1)).subscribe(observer);
exports.handleStreamOnce = handleStreamOnce;
const applyCallbackToMaybeAsync = (fn) => (entity) => {
    if ((0, rxjs_1.isObservable)(entity)) {
        return (0, exports.handleStreamOnce)({ next: fn })(entity);
    }
    if (entity instanceof Promise) {
        return entity.then(fn);
    }
    return fn(entity);
};
exports.applyCallbackToMaybeAsync = applyCallbackToMaybeAsync;
const mapObject = (fn, obj) => Object.entries(obj)
    .map(([key, value]) => [
    key,
    fn(value, key, obj),
])
    .reduce((newObj, [key, value]) => {
    newObj[key] = value;
    return newObj;
}, {});
exports.mapObject = mapObject;
