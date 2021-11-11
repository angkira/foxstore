export interface LogOptions {
    logger?: (...args: unknown[]) => void;
    logOn?: boolean;
    events?: boolean;
    reducers?: boolean;
    actions?: boolean;
    effects?: boolean;
    state?: boolean;
}

export interface HashMapOptions {
    on?: boolean;
    HashMapKey?: string;
    HashMapFn?: (...args: any[]) => string | number | symbol; // In the Future
}

export interface StoreOptions {
    storeName?: string;
    hashMap?: HashMapOptions;
    logOptions?: LogOptions;
    
}

export const DefaultStoreOptions: StoreOptions = {
    logOptions: {
        events: true,
        logOn: false,
        logger: console.log,
    },
};
