"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dispatcher = exports.FoxEvent = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * Atomaric data-unit, that may contain info
 *
 * @export
 * @class Event
 */
class FoxEvent {
    constructor(name, payload) {
        this.name = name;
        this.payload = payload;
    }
}
exports.FoxEvent = FoxEvent;
/**
 * Simple Event-manager
 *
 * @export
 * @class Dispatcher
 */
class Dispatcher {
    constructor(initEvent, scheduler = rxjs_1.queueScheduler) {
        this.scheduler = scheduler;
        this.eventBus$ = new rxjs_1.ReplaySubject();
        this.destroyEvent = new FoxEvent('Destroy');
        initEvent && this.dispatch(initEvent);
    }
    dispatch(event) {
        this.eventBus$.next(event);
    }
    listen(...eventNames) {
        const eventNameSet = new Set(eventNames);
        return this.eventBus$
            .pipe((0, operators_1.observeOn)(this.scheduler), (0, operators_1.takeWhile)((event) => event.name !== this.destroyEvent.name), (0, operators_1.filter)((event) => eventNameSet.has(event.name)), (0, operators_1.shareReplay)(1));
    }
    emitDestroy() {
        this.dispatch(this.destroyEvent);
    }
    get destroy$() {
        return this.listen(this.destroyEvent.name);
    }
}
exports.Dispatcher = Dispatcher;
