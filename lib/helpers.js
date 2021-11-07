"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStreamOnce = void 0;
const rxjs_1 = require("rxjs");
const handleStreamOnce = (observer) => (stream$) => stream$.pipe((0, rxjs_1.take)(1)).subscribe(observer);
exports.handleStreamOnce = handleStreamOnce;
