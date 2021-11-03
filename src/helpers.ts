import { Observable, Observer, Subscriber, take } from "rxjs";

export const handleStreamOnce = <T>(observer: Partial<Observer<T>>) => (stream$: Observable<T>) => 
    stream$.pipe(take(1)).subscribe(observer);