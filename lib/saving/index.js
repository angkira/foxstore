"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageSaver = void 0;
__exportStar(require("./saver"), exports);
// export { IndexedDBSaver } from './IndexedDBSaver';
var LocalStorageSaver_1 = require("./LocalStorageSaver");
Object.defineProperty(exports, "LocalStorageSaver", { enumerable: true, get: function () { return LocalStorageSaver_1.LocalStorageSaver; } });