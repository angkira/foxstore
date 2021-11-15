"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDBSaver = void 0;
const mol_db_1 = require("mol_db");
const ramda_1 = require("ramda");
/**
 * In progress, does not work now
 */
class IndexedDBSaver {
    constructor(store, databaseName) {
        this.store = store;
        this.databaseName = databaseName;
        this.storageKey = String(this.store.options.storeName || Symbol("Store"));
    }
    save(state) {
        return __awaiter(this, void 0, void 0, function* () {
            const stateKeys = (0, ramda_1.keys)(state);
            const db = yield mol_db_1.$$.$mol_db(this.storageKey, (mig) => stateKeys.forEach((key) => mig.stores[key] || mig.store_make(key)));
            const transaction = db.change(...stateKeys);
            const stores = transaction.stores;
            yield Promise.all(stateKeys
                // .filter((key) => !Array.isArray(state[key]))
                .map((key) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                return (yield stores[key].clear()) &&
                    (yield stores[key].put((_a = state[key]) !== null && _a !== void 0 ? _a : {}));
            })));
            transaction.commit();
        });
    }
    restore() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield mol_db_1.$$.$mol_db(this.storageKey);
            const stores = db.stores;
            const transaction = db.read(...stores);
            return transaction;
        });
    }
}
exports.IndexedDBSaver = IndexedDBSaver;
