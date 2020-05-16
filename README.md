# Foxstore
Reactive Event-Driven Store

![alt text](https://raw.githubusercontent.com/angkira/foxstore/master/foxstore-github.jpg "Logo")
Simply analog of NgRx, if you wanna Reactive State Management, but do not want to use big structures (like NgRx) in dependencies. 

# Install
   Easy! Just install it from NPM
```
   npm install foxstore
```

# Usage

## Terminology

Action - function that may handle payload from some Event and returns another Event with some payload or not. Payload may be stream, so you should set async-param to True to handle it as stream.

Example:
```typescript

   //As method
   
   @Action('loadDocs', {writeAs: 'documents'})
   loadDocs(): Event {
      return new Event('docsLoaded', this.docService.load(), true)
      }
      
   // As function for EventScheme
   
   const loadDocs = new MetaAction('loadDocs', () => new Event('docsLoaded', this.docService.load(), true));
```

Reducer - function that syncronously changing Store state.

Example:
```typescript
   
   @Reducer('docsLoaded')
   separateDocs(docs: Doc[], state: State): State {
      return {
         ...state,
         activeDocs: docs.filter(isActive),
         inactiveDocs: docs.filter(not(isActive)),
         }
   }
```

Effect - just some side-effect, result of function wouldn`t be handled

Example:

```typescript
   
   @Effect('docsLoaded')
   logDocs(docs: Doc[]): void {
      console.log(`Docs loaded - ${docs.length} items`);
   }
```
## For classes

Use decorators for creating your own store!

Describe Actions, Reducers and Effects by selecting event-names.


```typescript

// Model of Store to make easier to navigate
interface StoreModel {
   documents: Doc,
};

// @Store() - be careful!
// Store-decorator now not works if you have some DI in Angular-Service
// or use {provideId: 'root'}, you should just extend ProtoStore class and it will handle decorators
@Injectable()
export class MainStore extends ProtoStore<StoreModel> {

   constructor(
      private docService: DocumentService,
      private emailService: EmailService,
      ) { super(); }

   @Effect('storeLoaded')
   sendEmail(payload: any): void {
     this.emailService.send('Inited!');
   }

   @Action('loadDocs', {writeAs: 'documents'})
   loadTemplates(filter: IFilter): Event {
     const docs$ = this.docService.getDocuments();

     // Returnes event cause it is one event-flow
     return new Event(
      'documentTemplatesLoaded',
      docs$, // returnes stream as payload in Event
      true); // flag 'isAsync' for event with stream-data
   }
}  
   ...
      // Somewhere in component.ts
      this.docs$ = this.store.select('documents'); // Here IDE will offer to you list of entities which you set in generic
      this.store.dispatch('loadDocs');
```

## Functions

You can use FoxStore without classes, but functions. It`s short, easy, readable. Can be useful with React or Vue, or another framework without angular-like service-classes

```typescript
import { ProtoStore, createStore, EventScheme, schemeGen } from 'foxstore';

const initState = {
  rows: 10,
  columns: 10,
  data: null,
};


const eventSheme = schemeGen({ // Important not to set type! Actual for 2.*
  storeInited: {
    effects: [{eventName: 'storeInited', effect: console.log}]
  }
});

store = createStore<typeof initState, typeof eventSheme>(initState, null, null, eventSheme);

store.dispatch('storeInited');
```
## Mix ways!

You can pass your EventScheme to ProtoStore constructor and have EventScheme and decorated methods
Example:

```typescript
   import { Action, Event, schemeGen, ProtoStore } from 'foxstore';
   
   interface InitState {
      docs: Doc[],
   }
   
   const initState: InitState = { docs: [], };
   
   const EventScheme = schemeGen({
      storeInited: { effects: [{eventName: 'storeInited', effect: console.log}],
      loadDocs: {}, // Pass EventScheme to generic to have autocompleting in .dispatch method
      // Events that decorated can be empty, just to be in keysof EventScheme
   });
   
   export class MeinStore extends ProtoStore<InitState, typeof EventScheme> {
      constructor(private docService: DocumentService) {
         super(initState, null, null, EventScheme);
      }
      
      @Action('loadDocs', {writeAs: 'documents'})
      loadDocs(): Event {
         return new Event('docsLoaded', this.docService.load(), true)
      }
   }
```

Flux-likely solution that contains simply types and methods to create Event-Driven Asynchronous Storage.

Was tested with Angular-applications.

*** 
Also, you can create Reactive Stateful Component by extending Store class. Then you will get component-store with own select(), patch() etc. It is useful if you have Component with a lot of dynamic data.
Example you can see here https://github.com/angkira/foxstore-example


tags: foxstore rxjs redux flux storage state reactive react state-management ngrx rx 
