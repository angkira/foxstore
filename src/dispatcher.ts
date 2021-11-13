import { Observable, queueScheduler, ReplaySubject, SchedulerLike } from 'rxjs';
import { filter, observeOn, shareReplay, takeWhile } from 'rxjs/operators';

/**
 * Atomaric data-unit, that may contain info
 *
 * @export
 * @class Event
 */
export class FoxEvent<Payload = unknown> {
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
    private eventBus$: ReplaySubject<FoxEvent> = new ReplaySubject<FoxEvent>();

    private readonly destroyEvent = new FoxEvent('Destroy');

    constructor(
        initEvent?: FoxEvent,
        private scheduler: SchedulerLike = queueScheduler,
    ) {
        initEvent && this.dispatch(initEvent);
    }

    dispatch(event: FoxEvent): void {
        this.eventBus$.next(event);
    }

    listen(eventName: string | symbol): Observable<FoxEvent> {
        return this.eventBus$
            .pipe(
                observeOn(this.scheduler),
                takeWhile((event: FoxEvent) =>
                    event.name !== this.destroyEvent.name),
                filter((event: FoxEvent) =>
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
