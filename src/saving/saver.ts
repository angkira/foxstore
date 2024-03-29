import { equals, pick } from 'ramda';
import { distinctUntilChanged, skip, takeUntil } from 'rxjs/operators';

import { FoxEvent } from '../core/dispatcher';
import { ProtoStore } from '../core/store';
import { MaybeAsync } from '../core/types';
import { applyCallbackToMaybeAsync } from '../helpers';
import { LocalStorageSaver } from './LocalStorageSaver';

export interface Saver<
    State extends Record<string, unknown>
    > {
    save(state: Partial<State>): MaybeAsync<void | Error>;
    restore(): MaybeAsync<Partial<State> | Error | null>;
}

type SaverByKey<
    State extends Record<string, unknown>,
    K extends keyof State = keyof State,
    Value extends State[K] & Record<string, unknown> = State[K] & Record<string, unknown>,
    > = {
    [key in K]: Saver<Value>
}

export interface SaverOptions<
    State extends Record<string, unknown>
    > {
    /**
     * Select one of the default or create your custom Saver
     */
    saver: { new(store: ProtoStore<State>): Saver<State> },
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

export class SavingSuccess<State> extends FoxEvent<Partial<State>> {
    constructor(savedState: Partial<State>) {
        super('Store Saving Success', savedState);
    }
}

export class SavingError<State> extends FoxEvent<Partial<State>> {
    constructor(unsavedState: Partial<State>) {
        super('Store Saving Error', unsavedState);
    }
}

export class RestoringSuccess<State> extends FoxEvent<Partial<State> | {} | null> {
    constructor(savedState: Partial<State> | {} | null) {
        super('Store Restoring Success', savedState);
    }
}

export class RestoringError<State> extends FoxEvent<Partial<State> | {} | null> {
    constructor(unsavedState: Partial<State> | {} | null) {
        super('Store Restoring Error', unsavedState);
    }
}

export const InitSaver = <State extends Record<string, unknown>>(store: ProtoStore<State>) => (SaverClass: { new(store: ProtoStore<State>): Saver<State> }) => {
    const saverOptions = store.options?.saving;
    const saver = new SaverClass(store);

    const compareByKeys = (keys?: (keyof State)[]) => keys && (
        (prevState: State | {}, newState: State | {}) =>
            equals(pick(keys, prevState), pick(keys, newState))
    )

    const restoredValue = saver.restore();

    applyCallbackToMaybeAsync((restoredState: Partial<State> | Error | null) => {
        if (restoredState instanceof Error) {
            store.dispatch(new RestoringError(restoredState))
        } else {
            store.patch(restoredState ?? {});
            store.dispatch(new RestoringSuccess(restoredState));
        }
    })(restoredValue);
    
    // Subscription for saving state
    store.store$.asObservable()
        .pipe(
            takeUntil(store.eventDispatcher.destroy$),
            distinctUntilChanged<State | {}>(
                compareByKeys(
                    saverOptions?.keysBySave || saverOptions?.keysToSave
                )
            ),
            skip(Number(!!restoredValue)),
        )
        .subscribe((state: State | {}) => {
            const savedState = saverOptions?.keysToSave ?
                pick(saverOptions.keysToSave, state)
                : state;
            
            const savingResult = saver.save(savedState);

            applyCallbackToMaybeAsync(
                (payload?: unknown) => store.dispatch(
                    payload instanceof Error ?
                        new SavingError(savedState)
                        : new SavingSuccess(savedState)
                ),
            )(savingResult);
        });
}

export const GetSaverByKey = <
    State extends Record<string, unknown>
    >(
        key: 'localStorage' | 'indexedDB',
        store: ProtoStore<State>,
) => {
    switch (key) {
        case 'localStorage': return new LocalStorageSaver<State>(store);
        case 'indexedDB': return new LocalStorageSaver<State>(store);
        default: throw new Error('No selected Saver: ' + key);
    }
}
