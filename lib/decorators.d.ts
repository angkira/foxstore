import 'reflect-metadata';
import { Dispatcher } from './dispatcher';
import { EventHandlerOptions, EventSchemeType, IActionOptions } from './types';
/**
 * Action MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @param {IActionOptions} [options]
 * @returns {MethodDecorator}
 */
export declare function Action(eventName: string | string[], options?: IActionOptions, outputEventName?: string): MethodDecorator;
/**
 * Reducer MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export declare function Reducer(eventName: string | string[], options?: EventHandlerOptions): MethodDecorator;
/**
 * Effect MethodDecorator for Store class, works by metadata of constructor.
 *
 * @export
 * @param {string} eventName
 * @returns {MethodDecorator}
 */
export declare function Effect(eventName: string | string[], options?: EventHandlerOptions): MethodDecorator;
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
export declare function Store<State extends Record<string, unknown> = {}>(initState?: State, customDispatcher?: Dispatcher, eventScheme?: EventSchemeType): any;
