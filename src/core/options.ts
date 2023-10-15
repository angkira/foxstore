import { SchedulerLike } from 'rxjs';

import { SaverOptions } from '../saving/saver';
import { HandlerName } from './types';

export type EntityToLog = HandlerName | "events" | "state";

export type LogOptions = {
  logger?: (...args: unknown[]) => void;
  logOn?: boolean;
  reduxDevTools?: boolean;
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

export interface StoreOptions<State extends Record<string, unknown>> {
  storeName?: string | symbol;
  hashMap?: HashMapOptions;
  logOptions?: LogOptions;
  dispatcher?: DispatcherOptions;
  saving?: SaverOptions<State>;
}

export const DefaultStoreOptions: StoreOptions<any> = {
  logOptions: {
    events: true,
    logOn: false,
    logger: console.log,
    reduxDevTools: false,
  },
};
