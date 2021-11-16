import { SchedulerLike } from 'rxjs';
import { SaverOptions } from '../saving/saver';
import { HandlerName } from './types';
export declare type EntityToLog = HandlerName | "events" | "state";
export declare type LogOptions = {
    logger?: (...args: unknown[]) => void;
    logOn?: boolean;
} & {
    [entity in EntityToLog]?: boolean;
};
export interface HashMapOptions {
    on?: boolean;
    HashMapKey?: string;
    HashMapFn?: (...args: any[]) => string | number | symbol;
}
export interface DispatcherOptions {
    scheduler?: SchedulerLike;
}
export interface StoreOptions<State extends Record<string, unknown>> {
    storeName?: string | symbol;
    hashMap?: HashMapOptions;
    logOptions?: LogOptions;
    dispatcher?: DispatcherOptions;
    saving?: SaverOptions<State>;
}
export declare const DefaultStoreOptions: StoreOptions<any>;
