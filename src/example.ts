import { FoxEvent } from './core/dispatcher';
import { DefaultStoreOptions } from './core/options';
import { createHandlers } from './core/setup';
import { ProtoStore } from './core/store';
import { ActionFn, ReducerFn } from './core/types';
import { writeAs } from './helpers';

type Item = {};
const someService: any = {};
interface PagingModel {
    pages: number;
    currentPage: number;
    total: number;
}
type State = {
    items: Item[];
    pageSize: number;
    itemsOnDisplay: Item[];
    paging: PagingModel;
}
const InitState: State = {
    items: [],
    pageSize: 5,
    itemsOnDisplay: [],
    paging: {
        pages: 0,
        currentPage: 0,
        total: 0,
    }
}

const enum Events {
    LoadItems = 'LoadItems',
    ItemsLoaded = 'ItemsLoaded',
    UpdatePage = 'UpdatePage',
    PagingChanged = 'PagingChanged',
}

const loadItems: ActionFn<State, void> = () =>
    new FoxEvent(Events.ItemsLoaded, someService.loadItems());

const writeItems: ReducerFn<State, Item[]> = writeAs('items');

const setPagingModel: ReducerFn<State, Item[]> = (
    items: Item[],
    state: State,
): Partial<State> => ({
    paging: {
        pages: Math.round(items.length / state.pageSize),
        currentPage: 1,
        total: items.length,
    },
})

const setDisplayingItems: ReducerFn<State, Item[]> = (
    items: Item[],
    state: State,
): Partial<State> => ({
    itemsOnDisplay: (items || state.items).slice(
        state.paging?.currentPage * state.pageSize - 1,
        state.pageSize,
    ),
})

const changePage: ActionFn<State, number> = (page: number, state: State) => state.paging.pages >= page
    ? new FoxEvent(Events.PagingChanged, {
            ...state.paging,
            currentPage: page,
        })
    : new FoxEvent('Error', 'Page number is not correct');

const updateDisplayItemsOnPageChange: ReducerFn<State, PagingModel> = (paging: PagingModel, state: State) =>
    setDisplayingItems(state.items, state)

const EventScheme = {
    [Events.LoadItems]: createHandlers<State, void>({
        actions: [
            [loadItems],
        ],
    })(Events.LoadItems),
    [Events.ItemsLoaded]: createHandlers<State, Item[]>({
        // You can order reducers to control changes
        reducers: [
            [writeItems],
            [setPagingModel],
            [setDisplayingItems],
        ],
    })(Events.ItemsLoaded),
    // I separated handling event from user and updating data
    [Events.UpdatePage]: createHandlers<State, number>({
        actions: [[changePage]]
    })(Events.UpdatePage),
    [Events.PagingChanged]: createHandlers<State, PagingModel>({
        reducers: [
            [writeAs<State>('paging')],
            [updateDisplayItemsOnPageChange],
        ]
    })(Events.PagingChanged)
}

type EventSchemeType = typeof EventScheme

const store = new ProtoStore<State, EventSchemeType>(
    InitState,
    EventScheme,
    DefaultStoreOptions,
)

store.dispatch(Events.LoadItems)

store.dispatch(Events.UpdatePage, 6)

store.dispatch(Events.UpdatePage, '6')