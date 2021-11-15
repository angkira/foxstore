import { ProtoStore } from '../core';
import { Saver } from './saver';
/**
 * In progress, does not work now
 */
export declare class IndexedDBSaver<State extends Record<string, unknown>> implements Saver<State> {
    private store;
    private databaseName?;
    private storageKey;
    constructor(store: ProtoStore<State>, databaseName?: string | undefined);
    save(state: Partial<State>): Promise<void | Error>;
    restore(): Promise<Partial<State> | null | Error>;
}
