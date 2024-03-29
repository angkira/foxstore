"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepMerge = exports.mapObject = exports.applyCallbackToMaybeAsync = exports.handleStreamOnce = exports.writeAs = void 0;
const ramda_1 = require("ramda");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const writeAs = (path) => (payload, state) => (0, ramda_1.assocPath)(path.split('.'), payload)({});
exports.writeAs = writeAs;
const handleStreamOnce = (observer) => (stream$) => observer && stream$.pipe((0, operators_1.take)(1)).subscribe(observer);
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
    .map(([key, value]) => [key, fn(value, key, obj)])
    .reduce((newObj, [key, value]) => {
    newObj[key] = value;
    return newObj;
}, {});
exports.mapObject = mapObject;
const deepMerge = (target, source) => !source || Object.keys(source).length === 0
    ? {}
    : Object.entries(source)
        .reduce((result, [key, value]) => {
        if (typeof value === 'object' && value !== null) {
            const prototype = Object.getPrototypeOf(value);
            let blank = {};
            try {
                blank = new prototype.constructor();
            }
            catch (e) {
                blank = {};
            }
            // @ts-ignore
            result[key] = (0, exports.deepMerge)(blank, value);
            Object.setPrototypeOf(result[key], blank);
        }
        else {
            result[key] = value;
        }
        return result;
    }, Object.setPrototypeOf((0, exports.deepMerge)(((value) => {
        if (typeof value !== 'object' || value === null) {
            return {};
        }
        const prototype = Object.getPrototypeOf(value);
        let blank = {};
        try {
            blank = new prototype.constructor();
        }
        catch (e) {
            blank = {};
        }
        return blank;
    })(target), target), Object.getPrototypeOf(source)));
exports.deepMerge = deepMerge;
Object.assign(window, {
    deepMerge: exports.deepMerge,
    Subject: rxjs_1.Subject,
});
