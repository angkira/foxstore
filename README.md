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
## For classes

Use decorators for creating your own store!

Describe Actions, Reducers and Effects by selecting event-names.

Be careful! Store-decorator now works only with Services.
In Components you can use it only as class-parent. So, in components it isn`t nessesary cause you have own methods :)

```typescript

// Model of Store to make easier to navigate
interface StoreModel {
   documents: Doc,
};

@Store()
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
     return new StoreEvent(
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
import { ProtoStore, createStore, EventScheme } from 'foxstore';

const initState = {
  rows: 10,
  columns: 10,
  data: null,
};


const eventSheme = { // Important not to set type! Actual for 2.0.7 
  storeInited: {
    effects: [{eventName: 'storeInited', effect: console.log}]
  }
}

store = createStore<typeof initState, typeof eventSheme>(initState, null, null, eventSheme);

store.dispatch('storeInited');
```

Flux-likely solution that contains simply types and methods to create Event-Driven Asynchronous Storage.

Was tested with Angular-applications.

*** 
Also, you can create Reactive Stateful Component by extending Store class. Then you will get component-store with own select(), patch() etc. It is useful if you have Component with a lot of dynamic data.
Example you can see here https://github.com/angkira/foxstore-example

I`m so sorry, guys, but using @Store decorator now is conflicting with Angular Singleton Service using. So, you should use SetupStoreEvents()(this) in constructor of your StoreClass .instead Decorator @Store


tags: foxstore rxjs redux flux storage state reactive react state-management ngrx rx 
