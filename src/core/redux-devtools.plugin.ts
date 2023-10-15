import { withLatestFrom } from 'rxjs/operators';
import { ProtoStore } from './store';
import { EventSchemeType } from './types';

export const setupReduxDevtoolsBinding = <
  State extends Record<string, unknown> = Record<string, unknown>,
  EventScheme extends EventSchemeType<State> = EventSchemeType<State>
>(initState: State | undefined, store: ProtoStore<State, EventScheme>) => {
  const devTools = (window as any)['__REDUX_DEVTOOLS_EXTENSION__'].connect({});

  if (!devTools) {
    return;
  }

  devTools.init({ state: initState })

  const state$ = store.selectAll();

  state$.subscribe(state => devTools.send({ type: 'STATE' }, { state }))

  const eventNames = Object.keys(store.eventScheme || {})

  if (eventNames.length) {
    store
      .listen(...eventNames)
      .pipe(
        withLatestFrom(state$)
      )
      .subscribe(([event, state]) => devTools.send(
        { type: `EVENT: ${String(event.name)}`, payload: event.payload },
        { state },
      )
      )
  }
}