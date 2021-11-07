interface LogOptions {
    logger?: (...args: unknown[]) => void;
    logOn?: boolean;
    events?: boolean;
    reducers?: boolean;
    actions?: boolean;
    effects?: boolean;
    state?: boolean;
}
interface HashMapOptions {
    on?: boolean;
    HashMapKey?: string;
    HashMapFn?: (...args: any[]) => string | number | symbol;
}
export interface StoreOptions {
    storeName?: string;
    hashMap?: HashMapOptions;
    logOptions?: LogOptions;
}
export declare const DefaultStoreOptions: StoreOptions;
export {};
