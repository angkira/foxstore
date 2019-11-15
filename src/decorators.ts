import { ProtoStore, StoreOptions, DefaultStoreOptions, HashMap } from './store';
import { withLatestFrom, mergeMap, take, shareReplay } from 'rxjs/operators';
import { Dispatcher, Event } from './dispatcher';
import { of, Subscription, Observable } from 'rxjs';
import 'reflect-metadata';

import { keys, values, forEach } from 'ramda';

const REDUCER_METAKEY = '@StoreReducers';
const ACTION_METAKEY = '@StoreActions';
const EFFECT_METAKEY = '@StoreEffects';

export type ActionFn  = (payload: any, state?: any) => Event;
export type ReducerFn = (payload: any, state?: any) => typeof state;
export type EffectFn  = (payload: any, state?: any) => void;

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
export class MetaAction {
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
export class MetaReducer {
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
export class MetaEffect {
    constructor(
        public eventName: string,
        public effect: EffectFn,
        public options?: IActionOptions,
    ) {}
}

export type MetaType = MetaAction | MetaReducer | MetaEffect;

export type EventScheme = { [eventName: string]: {
    actions?: MetaAction[],
    reducers?: MetaReducer[],
    effects?: MetaEffect[],
} } & Object;

/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
export function Action(eventName: string, options?: IActionOptions): MethodDecorator {
    return function (store: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
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
    return function (store: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
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
    return function (store: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
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
export function Store<InitState extends Object = {}>(
    initState?: InitState,
    customDispatcher?: Dispatcher,
    eventScheme: EventScheme = {},
    ): any {
    return function (target: any = Object): (args: any[]) => ProtoStore<typeof initState> {
        // save a reference to the original constructor

        // The new constructor behaviour
        const f: (args: any) => ProtoStore<InitState> = function (...args: any[]): ProtoStore<InitState> {
            // const newInstance = new ProtoStore<typeof initState>(initState);
            // newInstance['__proto__'] = original.prototype;
            const newInstance = new target(...args);


            const constructor = newInstance['__proto__'].constructor;

            newInstance.eventDispatcher = customDispatcher || newInstance.eventDispatcher;

            const effects: MetaEffect[] = Reflect.getMetadata(EFFECT_METAKEY, constructor)
                || [];
            const reducers: MetaReducer[] = Reflect.getMetadata(REDUCER_METAKEY, constructor)
                || [];
            const actions: MetaAction[] = Reflect.getMetadata(ACTION_METAKEY, constructor)
                || [];

            const metadataEventScheme: EventScheme = {} || eventScheme;

            const entityReducer = (entityName: 'actions' | 'effects' | 'reducers') =>
                (scheme: EventScheme, entity: MetaType) => {
                    scheme[entity.eventName] = scheme[entity.eventName] 
                                                || { [entityName]: [] };
                    (scheme[entity.eventName][entityName] as (typeof entity)[]).push(entity);
                    return scheme;
                }

            effects.reduce(entityReducer('effects'), metadataEventScheme);
            actions.reduce(entityReducer('actions'), metadataEventScheme);
            reducers.reduce(entityReducer('reducers'), metadataEventScheme);

            setupStoreEvents(metadataEventScheme)(newInstance);

            return newInstance;
        };

        f.prototype = target['__proto__'];

        return f;
    };
}
/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
export const setupStoreEvents = <State, Scheme>(eventScheme: EventScheme = {}) =>
    (newInstance: ProtoStore<State, Scheme>) => {
            const reducerHandler = reducerMetaHandler(newInstance);

            const effectHandler = effectMetaHandler(newInstance);

            const actionHandler = actionMetaHandler(newInstance);

            const handlersMap = {
                reducers: reducerHandler,
                effects: effectHandler,
                actions: actionHandler,
            };

            type Keys = keyof EventScheme[string];

            type EventBindings = {
                [key in Keys]: MetaType[];
            };

            const entityLists: EventBindings = values(eventScheme)
                .reduce((acc: EventBindings | any, event: EventBindings | any) => {
                    (keys(event) as Keys[])
                        .map((key: Keys) => {
                            acc[key] = (acc[key] || []).concat(event[key]);
                        });
                    return acc;
                }, {});

            keys(entityLists).forEach((entityType: Keys) =>
                forEach<any>(handlersMap[entityType])(entityLists[entityType]));

            return newInstance;
    }
/**
 * Just write entity to Store by name
 * @param instance - Store instance
 */
function simplyMetaPatcher(instance: ProtoStore<any>):
    (event: Event, writeAs: string, state: any) => Subscription {
        return (event: Event, writeAs: string, state: any) =>
            (event.async ?
                event.payload
                : of(event.payload))
                .subscribe((actionPayload: any) =>
                    instance.patch(
                        simplyReducer(writeAs)
                            .call(
                                instance,
                                actionPayload,
                                state,
                                )));
}

/**
 * Get event payload
 * @param instance - Store instance
 */
function metaGetEntityPayload({eventDispatcher, store$}: ProtoStore<any>):
    (entityType: MetaType) => Observable<any> {
    return (entity: MetaType) =>
        eventDispatcher
            .listen(entity.eventName)
            .pipe(
                // tap(x => console.log(x)), // TODO: create Log-plugin to log events. ReduxTools - maybe
                mergeMap((event: Event) =>
                    (event.async ?
                        event.payload
                        : of(event.payload))
                            .pipe(take(1))),
                withLatestFrom(store$.pipe(take(1))),
                shareReplay(1),
            );
}

/**
 * Handler for reducer
 * @param instance 
 */
function reducerMetaHandler(instance: ProtoStore<any>) {
    return (reducer: MetaReducer) =>
        metaGetEntityPayload(instance)(reducer)
            .subscribe(([payload, state]) =>
                instance.patch(
                    reducer.reducer.call(instance, payload, state)));
}

/**
 * Handler for Effect
 * @param instance 
 */
function effectMetaHandler(instance: ProtoStore<any>) {
    return (effect: MetaEffect) =>
        metaGetEntityPayload(instance)(effect)
            .subscribe(([payload, state]) =>
                effect.effect.call(instance, payload, state));
}

/**
 * Handler for Action
 * @param instance 
 */
function actionMetaHandler(instance: ProtoStore<any>) {
    return (action: MetaAction) =>
        metaGetEntityPayload(instance)(action)
            .subscribe(([payload, state]) => {
                const result = action.action.call(instance, payload, state) as Event;

                instance.eventDispatcher.dispatch(result);

                if (action.options && action.options.writeAs) {
                    simplyMetaPatcher(instance)(result, action.options.writeAs, state);
                }
            });
}

/**
 * Best way to create Store without classes.
 * Just set eventything and get new Store
 * @param initState - init state where you can set type of every entity in Store
 * @param customDispatcher - custom event dispatcher, if you need connect a few Stores
 * @param options - extra options for Store
 * @param eventScheme - scheme of events and its handlers
 */
export const createStore = <InitState,
    SchemeType extends EventScheme = HashMap<any>>(
        initState?: InitState,
        customDispatcher?: Dispatcher | null,
        options?: StoreOptions | null,
        eventScheme?: SchemeType | Object,
    ) => setupStoreEvents<InitState, SchemeType>(eventScheme as EventScheme)
        (new ProtoStore<InitState, SchemeType>(initState, options, customDispatcher))
