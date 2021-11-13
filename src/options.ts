import { SchedulerLike } from 'rxjs';
import { HandlerName } from "./types";

export type EntityToLog = HandlerName | "events" | "state";

export type LogOptions = {
  logger?: (...args: unknown[]) => void;
  logOn?: boolean;
} & {
  [entity in EntityToLog]?: boolean;
};

export interface HashMapOptions {
  on?: boolean;
  HashMapKey?: string;
  HashMapFn?: (...args: any[]) => string | number | symbol; // In the Future
}

export interface DispatcherOptions {
    scheduler?: SchedulerLike;
}

export interface StoreOptions {
  storeName?: string | symbol;
  hashMap?: HashMapOptions;
  logOptions?: LogOptions;
  dispatcher?: DispatcherOptions;
}

export const DefaultStoreOptions: StoreOptions = {
  logOptions: {
    events: true,
    logOn: false,
    logger: console.log,
  },
};
