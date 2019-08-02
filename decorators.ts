import { ProtoStore } from './store';
import { withLatestFrom, mergeMap, take, shareReplay } from 'rxjs/operators';
import { Dispatcher, Event } from './dispatcher';
import { ReplaySubject, of } from 'rxjs';
import 'reflect-metadata';

const REDUCER_METAKEY = '@StoreReducers';
const ACTION_METAKEY = '@StoreActions';
const EFFECT_METAKEY = '@StoreEffects';

type ActionFn  = (payload: any, state?: any) => Event;
type ReducerFn = (payload: any, state?: any) => typeof state;
type EffectFn  = (payload: any, state?: any) => void;

const simplyReducer: ReducerFn = (fieldName: string) =>
    (payload: any, state: any) =>
        ({ [fieldName] : payload });

/**
 * Options for StoreAction for optimized handling
 *
 * @interface IActionOptions
 */
interface IActionOptions {
    writeAs: string; // To write gotten info exactly into Store as entity with selected name
}

/**
 * Entity for interaction with ethernal system, like asynchronous actions (HttpRequest, etc.)
 *
 * @class MetaAction
 */
class MetaAction {
    constructor(
        public eventName: string,
        public action: ActionFn,
        public options?: IActionOptions,
    ) { }
}

/**
 * Synchronous action that modify Store state
 *
 * @class MetaReducer
 */
class MetaReducer {
    constructor(
        public eventName: string,
        public reducer: ReducerFn,
        public options?: IActionOptions,
        ) { }
}

/**
 * Side-effects
 *
 * @class MetaEffect
 */
class MetaEffect {
    constructor(
        public eventName: string,
        public effect: EffectFn,
        public options?: IActionOptions,
    ) {}
}

/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
export function Action(eventName: string, options?: IActionOptions): MethodDecorator {
    return function (store: ProtoStore<any>, propertyKey: string, descriptor: PropertyDescriptor) {
        const actions: MetaAction[] = Reflect.getMetadata(ACTION_METAKEY, store.constructor) || [];
        const action = descriptor.value as ActionFn;

        actions.push(new MetaAction(eventName, action, options));
        Reflect.defineMetadata(ACTION_METAKEY, actions, store.constructor);

    };
}

/**
 * Reducer MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export function Reducer(eventName: string): MethodDecorator {
    return function (store: ProtoStore<any>, propertyKey: string, descriptor: PropertyDescriptor) {
        const reducer: ReducerFn = descriptor.value;
        const reducers: MetaReducer[] = Reflect.getMetadata(REDUCER_METAKEY, store.constructor) || [];
        reducers.push(new MetaReducer(eventName, reducer));
        Reflect.defineMetadata(REDUCER_METAKEY, reducers, store.constructor);
    };
}

/**
 * Effect MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export function Effect(eventName: string): MethodDecorator {
    return function (store: ProtoStore<any>, propertyKey: string, descriptor: PropertyDescriptor) {
        const effect = descriptor.value;
        const effects: MetaEffect[] = Reflect.getMetadata(EFFECT_METAKEY, store.constructor) || [];
        effects.push(new MetaEffect(eventName, effect));
        Reflect.defineMetadata(EFFECT_METAKEY, effects, store.constructor);
    };
}

/**
 * Store decorator. Can be used for Injectable services like in Angular
 * Waiting for Decorators will became not "experimental" to work with types correctly.
 * Now, to use Store-class methods you should extend your class from ProtoStore, sorry.
 * I hope that in short time I will find way to use it in simplier way.
 * @export
 * @param {*} [initState]
 * @param {Dispatcher} [customDispatcher]
 * @returns {*}
 */
export function Store(initState?: any, customDispatcher?: Dispatcher): any {
    return function (target: {new(...args: any[]): any}): (args: any[]) => ProtoStore<typeof initState> {
        // save a reference to the original constructor
        const original = target;

        // The new constructor behaviour
        const f: (args: any) => ProtoStore<typeof initState> = function (...args: any[]): ProtoStore<typeof initState> {
            // const newInstance = new ProtoStore<typeof initState>(initState);
            // newInstance['__proto__'] = original.prototype;
            const newInstance = new original(...args);

            const dispatcher = customDispatcher ||
                Reflect.get(newInstance, 'dispatcher') as Dispatcher;
            const state$ = Reflect.get(newInstance, 'state$') as ReplaySubject<any>;

            const effects: MetaEffect[] = Reflect.getMetadata(EFFECT_METAKEY, target)
                || [];
            const reducers: MetaReducer[] = Reflect.getMetadata(REDUCER_METAKEY, target)
                || [];
            const actions: MetaAction[] = Reflect.getMetadata(ACTION_METAKEY, target)
                || [];

            
            const getEntityPayload = (entity: MetaAction | MetaReducer | MetaEffect) =>
              dispatcher
                .listen(entity.eventName)
                .pipe(
                    // tap(x => console.log(x)), // TODO: create Log-plugin to log events. ReduxTools - maybe
                    mergeMap((event: Event) =>
                        (event.async ?
                            event.payload
                            : of(event.payload))
                                .pipe(take(1))),
                    withLatestFrom(state$.pipe(take(1))),
                    shareReplay(1),
                );

            const reducerHandler = (reducer: MetaReducer) =>
                getEntityPayload(reducer)
                    .subscribe(([payload, state]) =>
                        newInstance.patch(
                            reducer.reducer.call(newInstance, payload, state)));

            const effectHandler = (effect: MetaEffect) =>
                getEntityPayload(effect)
                  .subscribe(([payload, state]) =>
                      effect.effect.call(newInstance, payload, state));

            const simplyPatcher = (event: Event, writeAs: string, state: any) =>
                (event.async ?
                    event.payload
                    : of(event.payload))
                    .subscribe((actionPayload: any) =>
                        newInstance.patch(
                            simplyReducer(writeAs)
                                .call(
                                    newInstance,
                                    actionPayload,
                                    state)));

            const actionHandler = (action: MetaAction) =>
                    getEntityPayload(action)
                    .subscribe(([payload, state]) => {
                        const result = action.action.call(newInstance, payload, state) as Event;
                        dispatcher.dispatch(result);
                        if (action.options && action.options.writeAs) {
                            simplyPatcher(result, action.options.writeAs, state);
                        }
                    });

            effects.forEach(effectHandler);
            reducers.forEach(reducerHandler);
            actions.forEach(actionHandler);

            return newInstance;
        };

        f.prototype = original['__proto__'];

        return f;
    };
}
