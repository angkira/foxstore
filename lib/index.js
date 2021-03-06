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
exports.Event = exports.Dispatcher = void 0;
__exportStar(require("./store"), exports);
__exportStar(require("./decorators"), exports);
__exportStar(require("./types"), exports);
var dispatcher_1 = require("./dispatcher");
Object.defineProperty(exports, "Dispatcher", { enumerable: true, get: function () { return dispatcher_1.Dispatcher; } });
Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return dispatcher_1.Event; } });
