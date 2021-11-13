import { ProtoStore } from './store';
import { ActionFn, ReducerFn, EventSchemeType } from './types';
import { FoxEvent } from './dispatcher';
import { createHandlers } from './setup';

const initState = {
    counter: 0,
}

type State = typeof initState;

const enum EventKeys {
    IncrementCounter = 'IncrementCounter',
    CounterIncremented = 'CounterIncremented',
}

const incrementCounter: ActionFn<State, void> = (payload: void, state: State) => new FoxEvent('inited', (state.counter ?? 0) + 1);

const saveCounter: ReducerFn<State, number> = (counter: number) => ({ counter });

const eventScheme = {
    [EventKeys.IncrementCounter]: createHandlers<State, void>({
        actions: [
            [incrementCounter, {}]
        ],
    })(EventKeys.IncrementCounter),
    [EventKeys.CounterIncremented]: createHandlers<State, number>({
        reducers: [
            [saveCounter, {}]
        ],
    })(EventKeys.CounterIncremented),
};

type EventScheme = typeof eventScheme;

const store = new ProtoStore<State, EventScheme>(initState, eventScheme);

store.dispatch(EventKeys.IncrementCounter)
store.dispatch(EventKeys.CounterIncremented, 10)

class IncrementEvent extends FoxEvent<number> {
    constructor(value: number) {
        super(EventKeys.IncrementCounter, value)
    }
}

const IncEvent = new IncrementEvent(10);

store.dispatch(IncEvent);