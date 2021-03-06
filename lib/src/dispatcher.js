"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * Atomaric data-unit, that may contain info
 *
 * @export
 * @class Event
 */
class Event {
    constructor(name, payload, async = false) {
        this.name = name;
        this.payload = payload;
        this.async = async;
    }
}
exports.Event = Event;
/**
 * Simple Event-manager
 *
 * @export
 * @class Dispatcher
 */
class Dispatcher {
    constructor(initEvent) {
        this.eventBus$ = new rxjs_1.ReplaySubject();
        this.eventScope = new Set();
        this.destroyEvent = new Event('Destroy');
        initEvent && this.dispatch(initEvent);
    }
    dispatch(event) {
        this.eventScope.add(event.name);
        this.eventBus$.next(event);
    }
    listen(eventName) {
        return this.eventBus$
            .pipe(
        // @ts-ignore
        operators_1.takeWhile((event) => event.name !== this.destroyEvent.name), operators_1.filter((event) => event.name === eventName));
    }
    emitDestroy() {
        this.dispatch(this.destroyEvent);
    }
    get destroy$() {
        return this.listen(this.destroyEvent.name);
    }
}
exports.Dispatcher = Dispatcher;
