"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSaverByKey = exports.InitSaver = exports.RestoringError = exports.RestoringSuccess = exports.SavingError = exports.SavingSuccess = void 0;
const ramda_1 = require("ramda");
const operators_1 = require("rxjs/operators");
const dispatcher_1 = require("../core/dispatcher");
const helpers_1 = require("../helpers");
const LocalStorageSaver_1 = require("./LocalStorageSaver");
class SavingSuccess extends dispatcher_1.FoxEvent {
    constructor(savedState) {
        super('Store Saving Success', savedState);
    }
}
exports.SavingSuccess = SavingSuccess;
class SavingError extends dispatcher_1.FoxEvent {
    constructor(unsavedState) {
        super('Store Saving Error', unsavedState);
    }
}
exports.SavingError = SavingError;
class RestoringSuccess extends dispatcher_1.FoxEvent {
    constructor(savedState) {
        super('Store Restoring Success', savedState);
    }
}
exports.RestoringSuccess = RestoringSuccess;
class RestoringError extends dispatcher_1.FoxEvent {
    constructor(unsavedState) {
        super('Store Restoring Error', unsavedState);
    }
}
exports.RestoringError = RestoringError;
const InitSaver = (store) => (SaverClass) => {
    var _a;
    const saverOptions = (_a = store.options) === null || _a === void 0 ? void 0 : _a.saving;
    const saver = new SaverClass(store);
    const compareByKeys = (keys) => keys && ((prevState, newState) => (0, ramda_1.equals)((0, ramda_1.pick)(keys, prevState), (0, ramda_1.pick)(keys, newState)));
    const restoredValue = saver.restore();
    (0, helpers_1.applyCallbackToMaybeAsync)((restoredState) => {
        if (restoredState instanceof Error) {
            store.dispatch(new RestoringError(restoredState));
        }
        else {
            store.patch(restoredState !== null && restoredState !== void 0 ? restoredState : {});
            store.dispatch(new RestoringSuccess(restoredState));
        }
    })(restoredValue);
    // Subscription for saving state
    store.store$.asObservable()
        .pipe((0, operators_1.takeUntil)(store.eventDispatcher.destroy$), (0, operators_1.distinctUntilChanged)(compareByKeys((saverOptions === null || saverOptions === void 0 ? void 0 : saverOptions.keysBySave) || (saverOptions === null || saverOptions === void 0 ? void 0 : saverOptions.keysToSave))), (0, operators_1.skip)(Number(!!restoredValue)))
        .subscribe((state) => {
        const savedState = (saverOptions === null || saverOptions === void 0 ? void 0 : saverOptions.keysToSave) ?
            (0, ramda_1.pick)(saverOptions.keysToSave, state)
            : state;
        const savingResult = saver.save(savedState);
        (0, helpers_1.applyCallbackToMaybeAsync)((payload) => store.dispatch(payload instanceof Error ?
            new SavingError(savedState)
            : new SavingSuccess(savedState)))(savingResult);
    });
};
exports.InitSaver = InitSaver;
const GetSaverByKey = (key, store) => {
    switch (key) {
        case 'localStorage': return new LocalStorageSaver_1.LocalStorageSaver(store);
        case 'indexedDB': return new LocalStorageSaver_1.LocalStorageSaver(store);
        default: throw new Error('No selected Saver: ' + key);
    }
};
exports.GetSaverByKey = GetSaverByKey;
