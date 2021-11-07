import { Observable, queueScheduler, ReplaySubject, SchedulerLike } from 'rxjs';
import { filter, observeOn, shareReplay, takeWhile } from 'rxjs/operators';

/**
 * Atomaric data-unit, that may contain info
 *
 * @export
 * @class Event
 */
export class Event<Payload = unknown> {
    constructor(
        public name: string | symbol,
        public payload?: Payload | Observable<Payload> | Promise<Payload>,
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
    private eventBus$: ReplaySubject<Event> = new ReplaySubject<Event>();

    private readonly destroyEvent = new Event('Destroy');

    constructor(
        initEvent?: Event,
        private scheduler: SchedulerLike = queueScheduler,
    ) {
        initEvent && this.dispatch(initEvent);
    }

    dispatch(event: Event): void {
        this.eventBus$.next(event);
    }

    listen(eventName: string | symbol): Observable<Event> {
        return this.eventBus$
            .pipe(
                observeOn(this.scheduler),
                takeWhile((event: Event) =>
                    event.name !== this.destroyEvent.name),
                filter((event: Event) =>
                    event.name === eventName),
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
