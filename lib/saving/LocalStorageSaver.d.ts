import { ProtoStore } from '../core/store';
import { Saver } from './saver';
export declare class LocalStorageSaver<State extends Record<string, unknown>> implements Saver<State> {
    private store;
    private storageKey;
    constructor(store: ProtoStore<State>);
    save(state: Partial<State>): Promise<void | Error>;
    restore(): Promise<Partial<State> | null | Error>;
}
