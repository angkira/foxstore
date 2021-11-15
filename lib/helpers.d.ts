import { Observable, Observer, Subscription } from 'rxjs';
import { MaybeAsync } from './core/types';
export declare const handleStreamOnce: <T>(observer: Partial<Observer<T>>) => (stream$: Observable<T>) => Subscription;
export declare const applyCallbackToMaybeAsync: <Entity, Result>(fn: (agr: Entity) => Result) => (entity: MaybeAsync<Entity>) => Subscription | Result | Promise<Result>;
declare type MapObject = <T extends object, K extends keyof T = keyof T, V extends T[K] = T[K], NV = V>(fn: (value: V, key?: K, obj?: T) => NV, obj: T) => Record<K, NV | V>;
export declare const mapObject: MapObject;
export {};
