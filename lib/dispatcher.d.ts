import { Observable, SchedulerLike } from 'rxjs';
/**
 * Atomaric data-unit, that may contain info
 *
 * @export
 * @class Event
 */
export declare class Event<Payload = unknown> {
    name: string | symbol;
    payload?: Payload | Observable<Payload> | Promise<Payload> | undefined;
    async: boolean;
    constructor(name: string | symbol, payload?: Payload | Observable<Payload> | Promise<Payload> | undefined, async?: boolean);
}
/**
 * Simple Event-manager
 *
 * @export
 * @class Dispatcher
 */
export declare class Dispatcher {
    private scheduler;
    private eventBus$;
    private readonly destroyEvent;
    constructor(initEvent?: Event, scheduler?: SchedulerLike);
    dispatch(event: Event): void;
    listen(eventName: string | symbol): Observable<Event>;
    emitDestroy(): void;
    get destroy$(): Observable<Event<unknown>>;
}
