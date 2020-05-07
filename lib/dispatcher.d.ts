import { Observable } from 'rxjs';
/**
 * Atomaric data-unit, that may contain info
 *
 * @export
 * @class Event
 */
export declare class Event {
    name: string;
    payload?: any;
    async: boolean;
    constructor(name: string, payload?: any, async?: boolean);
}
/**
 * Simple Event-manager
 *
 * @export
 * @class Dispatcher
 */
export declare class Dispatcher {
    private eventBus$;
    private eventScope;
    constructor(initEvent?: Event);
    private readonly destroyEvent;
    dispatch(event: Event): void;
    listen(eventName: string): Observable<Event>;
    emitDestroy(): void;
    get destroy$(): Observable<Event>;
}
