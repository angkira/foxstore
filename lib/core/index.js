"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandlers = exports.Event = exports.Dispatcher = void 0;
__exportStar(require("./store"), exports);
__exportStar(require("./decorators"), exports);
__exportStar(require("./types"), exports);
var dispatcher_1 = require("./dispatcher");
Object.defineProperty(exports, "Dispatcher", { enumerable: true, get: function () { return dispatcher_1.Dispatcher; } });
Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return dispatcher_1.FoxEvent; } });
var setup_1 = require("./setup");
Object.defineProperty(exports, "createHandlers", { enumerable: true, get: function () { return setup_1.createHandlers; } });
