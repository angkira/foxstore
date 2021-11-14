import { ProtoStore } from '../core/store';
import { Saver } from './saver';

export class LocalStorageSaver<
    State extends Record<string, unknown>
    > implements Saver<State> {
    private storageKey: string = String(this.store.options.storeName || Symbol('Store'));

    constructor(private store: ProtoStore<State>) { }

    async save(state: Partial<State>): Promise<void | Error> {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (error: unknown) {
            if (error instanceof ReferenceError) {
                return new Error('LocalStorage is not able!');
            } else {
                return error as Error;
            }
        }
    }

    async restore(): Promise<Partial<State> | null | Error> {
        try {
            const storedValue = localStorage.getItem(this.storageKey);

            return storedValue ? JSON.parse(storedValue) : null;
        } catch (error: unknown) {
            if (error instanceof ReferenceError) {
                return new Error('LocalStorage is not able!');
            }
        }

        return null;
    }
}
