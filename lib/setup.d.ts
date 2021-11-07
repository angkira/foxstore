import { RawEventConfig } from '.';
import { ProtoStore } from './store';
import { EventConfig, EventSchemeType } from './types';
/**
 * Gets Actions, Reducers and Effects from metadata and create EventScheme
 * @param store
 * @param eventScheme
 */
export declare const setupEventsSchemeFromDecorators: <State extends Record<string, unknown>, Scheme extends EventSchemeType>(store: any, eventScheme: Scheme) => void;
/**
 * Setup handling of Reducers, Actions, SideEffects without Decorator,
 * Use it in Constructor if you use Angular Injectable
 */
export declare const setupStoreEvents: <State extends Record<string, unknown>, Scheme extends EventSchemeType>(eventScheme: Scheme) => (newInstance: ProtoStore<State, Scheme>) => ProtoStore<State, Scheme>;
/**
 * Function to fix type-checking of SchemeEvents
 * @param scheme Scheme Object
 */
export declare const schemeGen: <Scheme extends EventSchemeType>(scheme: Scheme) => Scheme;
export declare const createHandlers: <State extends Record<string, unknown>, Payload>(config: RawEventConfig<State, Payload>) => (eventName: string | symbol) => EventConfig<State, Payload>;
