"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("./store");
const dispatcher_1 = require("./dispatcher");
const setup_1 = require("./setup");
const initState = {
    counter: 0,
};
const incrementCounter = (payload, state) => { var _a; return new dispatcher_1.Event('inited', ((_a = state.counter) !== null && _a !== void 0 ? _a : 0) + 1); };
const saveCounter = (counter) => ({ counter });
const eventScheme = {
    ["IncrementCounter" /* IncrementCounter */]: (0, setup_1.createHandlers)({
        actions: [
            [incrementCounter, {}]
        ],
    })("IncrementCounter" /* IncrementCounter */),
    ["CounterIncremented" /* CounterIncremented */]: (0, setup_1.createHandlers)({
        reducers: [
            [saveCounter, {}]
        ],
    })("CounterIncremented" /* CounterIncremented */),
};
const store = new store_1.ProtoStore(initState, eventScheme);
store.dispatch("IncrementCounter" /* IncrementCounter */);
store.dispatch("CounterIncremented" /* CounterIncremented */, 10);
