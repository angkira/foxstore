"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupReduxDevtoolsBinding = void 0;
const operators_1 = require("rxjs/operators");
const setupReduxDevtoolsBinding = (initState, store) => {
    const devTools = window['__REDUX_DEVTOOLS_EXTENSION__'].connect({});
    if (!devTools) {
        return;
    }
    devTools.init({ state: initState });
    const state$ = store.selectAll();
    state$.subscribe(state => devTools.send({ type: 'STATE' }, { state }));
    const eventNames = Object.keys(store.eventScheme || {});
    if (eventNames.length) {
        store
            .listen(...eventNames)
            .pipe((0, operators_1.withLatestFrom)(state$))
            .subscribe(([event, state]) => devTools.send({ type: `EVENT: ${String(event.name)}`, payload: event.payload }, { state }));
    }
};
exports.setupReduxDevtoolsBinding = setupReduxDevtoolsBinding;
