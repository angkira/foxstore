"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var store_1 = require("./store");
exports.ProtoStore = store_1.ProtoStore;
__export(require("./decorators"));
var dispatcher_1 = require("./dispatcher");
exports.Dispatcher = dispatcher_1.Dispatcher;
exports.Event = dispatcher_1.Event;
