import 'reflect-metadata';
import { Dispatcher } from './dispatcher';
import { ProtoStore } from './store';
import { ActionFn, EffectFn, EventHandlerOptions, EventSchemeType, IActionOptions, ReducerFn } from './types';
/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
export declare function Action(eventName: string | string[], options?: IActionOptions, outputEventName?: string): <State extends Record<string, unknown>, Payload>(store: ProtoStore<State, EventSchemeType<State>>, propertyKey: string | symbol, { value: action }: {
    value?: ActionFn<State, Payload> | undefined;
}) => void;
/**
 * Reducer MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export declare function Reducer(eventName: string | string[], options?: EventHandlerOptions): <State extends Record<string, unknown>, Payload>(store: ProtoStore<State, EventSchemeType<State>>, propertyKey: string | symbol, { value: reducer }: TypedPropertyDescriptor<ReducerFn<State, Payload>>) => void;
/**
 * Effect MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export declare function Effect(eventName: string | string[], options?: EventHandlerOptions): <State extends Record<string, unknown>, Payload>(store: ProtoStore<State, EventSchemeType<State>>, propertyKey: string | symbol, { value: effect }: TypedPropertyDescriptor<EffectFn<State, Payload>>) => void;
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
export declare function Store<State extends Record<string, unknown> = {}, EventScheme extends EventSchemeType<State> = EventSchemeType<State>>(initState: State | undefined, eventScheme: EventScheme, customDispatcher?: Dispatcher): any;
