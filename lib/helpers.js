"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapObject = exports.handleStreamOnce = void 0;
const rxjs_1 = require("rxjs");
const handleStreamOnce = (observer) => (stream$) => stream$.pipe((0, rxjs_1.take)(1)).subscribe(observer);
exports.handleStreamOnce = handleStreamOnce;
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
