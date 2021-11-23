import { Action, Reducer } from '../core';
import { FoxEvent } from '../core/dispatcher';
import { DefaultStoreOptions } from '../core/options';
import { ProtoStore } from '../core/store';
import { writeAs } from '../helpers';

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

class Store extends ProtoStore<State> {
    constructor() {
        super(InitState, {}, DefaultStoreOptions);
    }

    @Action(Events.LoadItems, {
        writeAs: 'items',
    }, Events.ItemsLoaded)
    loadItems() {
        return new FoxEvent(Events.ItemsLoaded, someService.loadItems());
    }

    @Reducer(Events.ItemsLoaded, { order: 1 })
    setPagingModel(
        items: Item[],
        state: State,
    ): Partial<State> {
        return {
            paging: {
                pages: Math.round(items.length / state.pageSize),
                currentPage: 1,
                total: items.length,
            },
        }
    }

    @Reducer(Events.ItemsLoaded, { order: 2 })
    private setDisplayingItems(
        items: Item[],
        state: State,
    ): Partial<State> {
        return {
            itemsOnDisplay: (items || state.items).slice(
                state.paging?.currentPage * state.pageSize - 1,
                state.pageSize,
            ),
        };
    }

    @Action(Events.UpdatePage, {
        writeAs: 'paging',
    }, Events.PagingChanged)
    changePage(page: number, state: State): FoxEvent<PagingModel | string> {
        return state.paging.pages >= page
            ? new FoxEvent(Events.PagingChanged, {
                ...state.paging,
                currentPage: page,
            })
            : new FoxEvent('Error', 'Page number is not correct');
    }

    @Reducer(Events.PagingChanged)
    updateDisplayItemsOnPageChange(paging: PagingModel, state: State) {
        return this.setDisplayingItems(state.items, {
            ...state,
            paging,
        })
    }
}

const store = new Store();


store.dispatch(Events.LoadItems)

store.dispatch(Events.UpdatePage, 6)

store.dispatch(Events.UpdatePage, '6')