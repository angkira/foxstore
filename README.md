# Foxstore
Reactive Event-Driven Store

Simply analog of NgRx, if you wanna Reactive State Management, but do not want to use big structures (like NgRx) in dependencies. 

Use decorators for creating your own store!

Describe Actions, Reducers and Effects by selecting event-names.

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
Flux-likely decision that contains simply types and methods to create Event-Driven Asynchronous Storage.

Was tested with Angular-applications.

*** 
Also, you can create ReactiveStateful Component by extending Store class. Then you will get component-store with own select(), patch() etc. It is useful if you have Component with a lot of dynamic data.
Example you can see here https://github.com/angkira/foxstore-example


tags: foxstore rxjs redux flux storage state reactive ngrx rx 
