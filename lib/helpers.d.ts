import { Observable, Observer } from "rxjs";
export declare const handleStreamOnce: <T>(observer: Partial<Observer<T>>) => (stream$: Observable<T>) => import("rxjs").Subscription;
declare type MapObject = <T extends object, K extends keyof T = keyof T, V extends T[K] = T[K], NV = V>(fn: (value: V, key?: K, obj?: T) => NV, obj: T) => Record<K, NV | V>;
export declare const mapObject: MapObject;
export {};
