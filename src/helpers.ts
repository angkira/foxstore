import { assocPath } from 'ramda';
import { isObservable, Observable, Observer, Subscription, take } from 'rxjs';

import { MaybeAsync } from './core/types';

export type Class<T> = { new (...args: any[]): T };

export const writeAs =
  <State>(path: string) =>
  (payload: unknown, state: State): Partial<State> =>
    assocPath(path.split('.'), payload)({}) as Partial<State>;

export const handleStreamOnce =
  <T>(observer: Partial<Observer<T>>) =>
  (stream$: Observable<T>) =>
    stream$.pipe(take(1)).subscribe(observer);

export const applyCallbackToMaybeAsync =
  <Entity, Result>(fn: (agr: Entity) => Result) =>
  (entity: MaybeAsync<Entity>): Subscription | Promise<Result> | Result => {
    if (isObservable(entity)) {
      return handleStreamOnce({ next: fn })(entity);
    }

    if (entity instanceof Promise) {
      return entity.then(fn);
    }

    return fn(entity);
  };

type MapObject = <
  T extends object,
  K extends keyof T = keyof T,
  V extends T[K] = T[K],
  NV = V
>(
  fn: (value: V, key?: K, obj?: T) => NV,
  obj: T
) => Record<K, NV | V>;

export const mapObject: MapObject = <
  T extends object,
  K extends keyof T = keyof T,
  V extends T[K] = T[K],
  NV = V
>(
  fn: (value: V, key?: K, obj?: T) => NV,
  obj: T
): Record<K, NV | V> =>
  (Object.entries(obj) as [K, V][])
    .map(([key, value]) => [key, fn(value, key, obj)] as [K, NV])
    .reduce<Record<K, NV | V>>(
      (newObj: Record<K, NV | V>, [key, value]: [K, NV | V]) => {
        newObj[key] = value;
        return newObj;
      },
      {} as Record<K, NV | V>
    );

export const deepMerge = <T, K extends keyof T>(
  target: Partial<T>,
  source: Partial<T>,
): Partial<T> =>
  !source || Object.keys(source).length === 0
    ? {}
    : (Object.entries(source) as [K, T[K]][])
      .reduce((
        result: Partial<T>,
        [key, value]: [K, T[K]],
      ) => {
        if (typeof value === 'object' && value !== null) {
          // @ts-ignore
          result[key] = deepMerge({}, value);

          Object.setPrototypeOf(result[key], Object.getPrototypeOf(value));
        } else {
          result[key] = value;
        }

        return result;
      },
        Object.setPrototypeOf(
          deepMerge({}, target),
          Object.getPrototypeOf(source),
        ) as Partial<T>);
