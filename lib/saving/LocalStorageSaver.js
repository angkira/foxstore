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
exports.LocalStorageSaver = void 0;
class LocalStorageSaver {
    constructor(store) {
        this.store = store;
        this.storageKey = String(this.store.options.storeName || Symbol('Store'));
    }
    save(state) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(state));
            }
            catch (error) {
                if (error instanceof ReferenceError) {
                    return new Error('LocalStorage is not able!');
                }
                else {
                    return error;
                }
            }
        });
    }
    restore() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const storedValue = localStorage.getItem(this.storageKey);
                return storedValue ? JSON.parse(storedValue) : null;
            }
            catch (error) {
                if (error instanceof ReferenceError) {
                    return new Error('LocalStorage is not able!');
                }
            }
            return null;
        });
    }
}
exports.LocalStorageSaver = LocalStorageSaver;
