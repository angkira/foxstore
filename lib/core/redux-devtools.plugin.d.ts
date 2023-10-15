import { ProtoStore } from './store';
import { EventSchemeType } from './types';
export declare const setupReduxDevtoolsBinding: <State extends Record<string, unknown> = Record<string, unknown>, EventScheme extends EventSchemeType<State> = EventSchemeType<State>>(initState: State | undefined, store: ProtoStore<State, EventScheme>) => void;
