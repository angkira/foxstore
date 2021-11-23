"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dispatcher_1 = require("./core/dispatcher");
const options_1 = require("./core/options");
const setup_1 = require("./core/setup");
const store_1 = require("./core/store");
const helpers_1 = require("./helpers");
const someService = {};
const InitState = {
    items: [],
    pageSize: 5,
    itemsOnDisplay: [],
    paging: {
        pages: 0,
        currentPage: 0,
        total: 0,
    }
};
const loadItems = () => new dispatcher_1.FoxEvent("ItemsLoaded" /* ItemsLoaded */, someService.loadItems());
const writeItems = (0, helpers_1.writeAs)('items');
const setPagingModel = (items, state) => ({
    paging: {
        pages: Math.round(items.length / state.pageSize),
        currentPage: 1,
        total: items.length,
    },
});
const setDisplayingItems = (items, state) => {
    var _a;
    return ({
        itemsOnDisplay: (items || state.items).slice(((_a = state.paging) === null || _a === void 0 ? void 0 : _a.currentPage) * state.pageSize - 1, state.pageSize),
    });
};
const changePage = (page, state) => state.paging.pages >= page
    ? new dispatcher_1.FoxEvent("PagingChanged" /* PagingChanged */, Object.assign(Object.assign({}, state.paging), { currentPage: page }))
    : new dispatcher_1.FoxEvent('Error', 'Page number is not correct');
const updateDisplayItemsOnPageChange = (paging, state) => setDisplayingItems(state.items, state);
const EventScheme = {
    ["LoadItems" /* LoadItems */]: (0, setup_1.createHandlers)({
        actions: [
            [loadItems],
        ],
    })("LoadItems" /* LoadItems */),
    ["ItemsLoaded" /* ItemsLoaded */]: (0, setup_1.createHandlers)({
        // You can order reducers to control changes
        reducers: [
            [writeItems],
            [setPagingModel],
            [setDisplayingItems],
        ],
    })("ItemsLoaded" /* ItemsLoaded */),
    // I separated handling event from user and updating data
    ["UpdatePage" /* UpdatePage */]: (0, setup_1.createHandlers)({
        actions: [[changePage]]
    })("UpdatePage" /* UpdatePage */),
    ["PagingChanged" /* PagingChanged */]: (0, setup_1.createHandlers)({
        reducers: [
            [(0, helpers_1.writeAs)('paging')],
            [updateDisplayItemsOnPageChange],
        ]
    })("PagingChanged" /* PagingChanged */)
};
const store = new store_1.ProtoStore(InitState, EventScheme, options_1.DefaultStoreOptions);
store.dispatch("LoadItems" /* LoadItems */);
store.dispatch("UpdatePage" /* UpdatePage */, 6);
store.dispatch("UpdatePage" /* UpdatePage */, '6');
