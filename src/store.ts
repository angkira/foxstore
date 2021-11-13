import { Observable, BehaviorSubject, pipe } from 'rxjs';
import {
  map,
  takeUntil,
  shareReplay,
  take,
  distinctUntilChanged,
} from 'rxjs/operators';
import { identity, indexBy, mergeDeepRight, path, prop } from 'ramda';
import { Dispatcher, FoxEvent } from './dispatcher';
import { setupStoreEvents, setupEventsSchemeFromDecorators } from './setup';
import { EventSchemeType, STORE_DECORATED_METAKEY } from './types';
import 'reflect-metadata';
import {
  StoreOptions,
  DefaultStoreOptions,
  EntityToLog,
} from './options';

/**
 * Parent class that contains all basic methods of Store
 *
 * @export
 * @class ProtoStore
 * @template State - type | interface for state of Store
 */
export class ProtoStore<
  State extends Record<string, unknown> = Record<string, unknown>,
  EventScheme extends EventSchemeType<State> = EventSchemeType<State>
> {
  /**
   * Subject that contains
   *
   * @type {(ReplaySubject<State | {}>)}
   * @memberof ProtoStore
   */
  readonly store$: BehaviorSubject<State | {}> = new BehaviorSubject<
    State | {}
  >({});

  constructor(
    private initState?: State,
    public eventScheme?: EventScheme,
    public options: StoreOptions = DefaultStoreOptions,
    public readonly eventDispatcher: Dispatcher = new Dispatcher(
      new FoxEvent('storeInit', initState),
      options.dispatcher?.scheduler
    )
  ) {
    initState && this.patch(initState);

    this.options = Object.assign(
      {},
      mergeDeepRight(DefaultStoreOptions, options)
    );

    !Reflect.getMetadata(STORE_DECORATED_METAKEY, this.constructor) &&
      setupEventsSchemeFromDecorators(this, eventScheme || {});

    eventScheme && setupStoreEvents<State, EventScheme>(eventScheme)(this);
  }
  /**
   * Selecting stream with data from Store by key.
   *
   * @template K
   * @param {K} [entityName] key of Entity from Store. If empty - returns all the Store.
   * @returns {Observable<State[K]>}
   * @memberof ProtoStore
   */
  select<K extends keyof State>(entityName: K): Observable<State[K]> {
    return pipe(
      distinctUntilChanged(),
      takeUntil<State[K]>(this.eventDispatcher.destroy$),
      shareReplay(1)
    )(
      this.store$.pipe(map(path([entityName as string]))) as Observable<
        State[K]
      >
    );
  }

  /**
   * Hack to get current value of Store as Object
   *
   * @readonly
   * @type {State}
   * @memberof ProtoStore
   */
  get snapshot(): State {
    return this.store$.getValue() as State;
  }

  /**
   * Patch current value of store by new.
   *
   * @param {State} update
   * @returns {this}
   * @memberof ProtoStore
   */
  patch(update: Partial<State>): this {
    const patchedState = Object.assign(
      mergeDeepRight<State, Partial<State>>(this.snapshot, update),
      this.options?.hashMap?.on ? this.getHashMap(update) : {}
    );

    this.store$.next(patchedState);

    const storeName: string = `${
      String(this.options?.storeName) || this['constructor'].name
    }`;

    this.log(
      {
        storeName,
        update,
        patchedState,
      },
      'state'
    );

    return this;
  }

  /**
   * Clears the Store state by empty object.
   *
   * @memberof ProtoStore
   */
  clear(): this {
    this.store$.next({});
    return this;
  }

  /**
   * Resets the Store state by init state.
   *
   * @memberof ProtoStore
   */
  reset(): this {
    this.store$.next(this.initState || {});
    return this;
  }

  dispatch<Payload>(event: FoxEvent<Payload>): this;
  dispatch<
    EventName extends Exclude<keyof EventScheme, number> | string | symbol,
    Payload extends EventScheme[Exclude<EventName, FoxEvent>]['payload']
  >(event: EventName, payload?: Payload): this {
    if (event instanceof FoxEvent) {
      this.eventDispatcher.dispatch(event);

      this.log(
        {
          eventName: event.name,
          payload: event.payload,
        },
        'events'
      );
    } else {
      this.eventDispatcher.dispatch(new FoxEvent<Payload>(event, payload));

      this.log(
        {
          eventName: event,
          payload,
        },
        'events'
      );
    }

    return this;
  }

  listen<
    EventName extends Exclude<keyof EventScheme, number> | string | symbol,
    Payload extends EventScheme[EventName]['payload']
  >(eventName: EventName): Observable<FoxEvent<Payload>> {
    return this.eventDispatcher.listen(eventName) as Observable<
      FoxEvent<Payload>
    >;
  }

  /**
   * This method lets to work with events dynamically
   *
   * @param eventName - event`s name to listen
   * @param callbackFn - function that gets payload of event as argument
   */
  on(
    eventName: string,
    callbackFn: Function,
    options: {
      once: boolean;
    }
  ): this {
    this.eventDispatcher
      .listen(eventName)
      .pipe(options.once ? take(1) : map(identity))
      .subscribe((event: FoxEvent) => callbackFn(event.payload));

    return this;
  }

  /**
   * Method to destroy this Store and all subscriptions connected to it.
   *
   * @memberof ProtoStore
   */
  destroy(): void {
    this.eventDispatcher.emitDestroy();
  }

  /**
   * For every list-entity in state returnes HashMap for easier using
   *
   */
  private getHashMap(value: Partial<State>): Record<string, any> {
    if (this.options?.hashMap?.on) {
      return Object.keys(value)
        .filter((key: keyof State) => Array.isArray(this.snapshot[key]))
        .map((entityKey: keyof State) => ({
          name: entityKey,
          // @ts-ignore
          value: indexBy(
            // @ts-ignore
            prop(this.options.hashMap.HashMapKey || 'id')
          )(this.snapshot[entityKey]),
        }))
        .reduce(
          (
            mapObject: Record<string, any>,
            entity: { name: keyof State; value: Record<string, any> }
          ) => {
            mapObject[`${entity.name}_Map`] = entity.value;
            return mapObject;
          },
          {}
        );
    } else {
      return {};
    }
  }

  public log<T>(entity: T, type: EntityToLog): this {
    const logOptions = this.options.logOptions;

    if (logOptions?.logOn && logOptions[type]) {
      logOptions.logger?.(`${type.toUpperCase()}: `, entity);
    }

    return this;
  }
}
