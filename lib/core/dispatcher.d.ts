import { Observable, SchedulerLike } from 'rxjs';
/**
 * Atomaric data-unit, that may contain info
 *
 * @export
 * @class Event
 */
export declare class FoxEvent<Payload = unknown> {
    name: string | symbol;
    payload?: Payload | Observable<Payload> | Promise<Payload> | undefined;
    constructor(name: string | symbol, payload?: Payload | Observable<Payload> | Promise<Payload> | undefined);
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
    constructor(initEvent?: FoxEvent, scheduler?: SchedulerLike);
    dispatch(event: FoxEvent): void;
    listen(eventName: string | symbol): Observable<FoxEvent>;
    emitDestroy(): void;
    get destroy$(): Observable<FoxEvent<unknown>>;
}
