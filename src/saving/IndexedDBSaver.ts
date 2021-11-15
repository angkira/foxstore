import { $$ } from 'mol_db';
import { keys } from 'ramda';

import { ProtoStore } from '../core';
import { Saver } from './saver';

type Schema<State> = Record<
    keyof State,
    {
    Key: Exclude<keyof State[keyof State], number | symbol>;
    Doc: State[keyof State] | {};
    Indexes: { full: Exclude<keyof State[keyof State], number | symbol>[] };
    }
>;
/**
 * In progress, does not work now
 */
export class IndexedDBSaver<
  State extends Record<string, unknown>
> implements Saver<State>
{
  private storageKey: string = String(
    this.store.options.storeName || Symbol("Store")
  );

  constructor(private store: ProtoStore<State>, private databaseName?: string) {}

  async save(state: Partial<State>): Promise<void | Error> {
    const stateKeys = keys(state) as Exclude<
      keyof Partial<State>,
      number | symbol
    >[];

    const db = await $$.$mol_db<Schema<State>>(this.storageKey, (mig) =>
      stateKeys.forEach(
        (key) => mig.stores[key as string] || mig.store_make(key as string)
      )
    );

    const transaction = db.change(...stateKeys);

    const stores = transaction.stores;
      
    await Promise.all(
      stateKeys
        // .filter((key) => !Array.isArray(state[key]))
        .map(
          async (key) =>
            (await stores[key].clear()) &&
            (await stores[key].put(state[key] ?? {}))
        )
    );

    transaction.commit();
  }

    async restore(): Promise<Partial<State> | null | Error> {
        const db = await $$.$mol_db<Schema<State>>(this.storageKey);
        const stores = db.stores as Exclude<keyof State, number | symbol>[]
        const transaction = db.read(...stores);

        return transaction as any;
  }
}
