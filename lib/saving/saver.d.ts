import { FoxEvent } from '../core/dispatcher';
import { ProtoStore } from '../core/store';
import { MaybeAsync } from '../core/types';
import { LocalStorageSaver } from './LocalStorageSaver';
export interface Saver<State extends Record<string, unknown>> {
    save(state: Partial<State>): MaybeAsync<void | Error>;
    restore(): MaybeAsync<Partial<State> | Error | null>;
}
declare type SaverByKey<State extends Record<string, unknown>, K extends keyof State = keyof State, Value extends State[K] & Record<string, unknown> = State[K] & Record<string, unknown>> = {
    [key in K]: Saver<Value>;
};
export interface SaverOptions<State extends Record<string, unknown>> {
    /**
     * Select one of the default or create your custom Saver
     */
    saver: {
        new (store: ProtoStore<State>): Saver<State>;
    };
    /**
     * Which keys of State would be saved
     */
    keysToSave?: (keyof State)[];
    /**
     * Changing which keys of the State would be a trigger of saving
     */
    keysBySave?: (keyof State)[];
    /**
     * Project: Saver for separate entity in State
     * Does not work yet!
     */
    saverByKey?: SaverByKey<State>;
}
export declare class SavingSuccess<State> extends FoxEvent<Partial<State>> {
    constructor(savedState: Partial<State>);
}
export declare class SavingError<State> extends FoxEvent<Partial<State>> {
    constructor(unsavedState: Partial<State>);
}
export declare class RestoringSuccess<State> extends FoxEvent<Partial<State> | {} | null> {
    constructor(savedState: Partial<State> | {} | null);
}
export declare class RestoringError<State> extends FoxEvent<Partial<State> | {} | null> {
    constructor(unsavedState: Partial<State> | {} | null);
}
export declare const InitSaver: <State extends Record<string, unknown>>(store: ProtoStore<State, import("../core/types").EventSchemeType<State, any>>) => (SaverClass: new (store: ProtoStore<State, import("../core/types").EventSchemeType<State, any>>) => Saver<State>) => void;
export declare const GetSaverByKey: <State extends Record<string, unknown>>(key: 'localStorage' | 'indexedDB', store: ProtoStore<State, import("../core/types").EventSchemeType<State, any>>) => LocalStorageSaver<State>;
export {};
