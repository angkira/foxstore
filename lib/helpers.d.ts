import { Observable, Observer } from "rxjs";
export declare const handleStreamOnce: <T>(observer: Partial<Observer<T>>) => (stream$: Observable<T>) => import("rxjs").Subscription;
