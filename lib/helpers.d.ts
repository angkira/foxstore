import { Observable, PartialObserver, Subscription } from 'rxjs';
import { MaybeAsync } from './core/types';
export type Class<T> = {
    new (...args: any[]): T;
};
export declare const writeAs: <State>(path: string) => (payload: unknown, state: State) => Partial<State>;
export declare const handleStreamOnce: <T>(observer: PartialObserver<T>) => (stream$: Observable<T>) => Subscription;
export declare const applyCallbackToMaybeAsync: <Entity, Result>(fn: (agr: Entity) => Result) => (entity: MaybeAsync<Entity>) => Subscription | Result | Promise<Result>;
type MapObject = <T extends object, K extends keyof T = keyof T, V extends T[K] = T[K], NV = V>(fn: (value: V, key?: K, obj?: T) => NV, obj: T) => Record<K, NV | V>;
export declare const mapObject: MapObject;
export declare const deepMerge: <T, K extends keyof T>(target: Partial<T>, source: Partial<T>) => Partial<T>;
export {};
