import { ReplaySubject, Observable } from 'rxjs';
import { filter, shareReplay, takeWhile } from 'rxjs/operators';

/**
 * Atomaric data-unit, that may contain info
 *
 * @export
 * @class Event
 */
export class Event {
    constructor(
        public name: string,
        public payload?: any | Observable<any>,
        public async: boolean = false,
    ) { }
}

/**
 * Simple Event-manager 
 *
 * @export
 * @class Dispatcher
 */
export class Dispatcher {
    private eventBus$ = new ReplaySubject();
    private eventScope: Set<string> = new Set();

    constructor(initEvent?: Event) {
        initEvent && this.dispatch(initEvent);
    }

    private readonly destroyEvent = new Event('Destroy');

    dispatch(event: Event): void {
        this.eventScope.add(event.name);
        this.eventBus$.next(event);
    }

    listen(eventName: string): Observable<Event> {
        return this.eventBus$
            .pipe(
                // @ts-ignore
                takeWhile((event: Event) =>
                    event.name !== this.destroyEvent.name),
                filter((event: Event) =>
                    event.name === eventName),
                    // tap(console.log) Turn on to log events by subscription
                shareReplay(1),
            );
    }

    emitDestroy(): void {
        this.dispatch(this.destroyEvent);
    }

    get destroy$() {
        return this.listen(this.destroyEvent.name);
    }
}
