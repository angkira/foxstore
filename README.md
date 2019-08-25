# reactive_store
Reactive Event-Driven Store

Simply analog of NgRx, if you wanna Reactive State Management, but do not want to use big structures (like NgRx) in dependencies. 

Use decorators for creating your own store!

Describe Actions, Reducers and Effects by selecting event-names.

```typescript
   @Effect('storeLoaded')
   sendEmail(payload: any): void {
     this.emailService.send('Inited!');
}
```
Flux-likely decision that contains simply types and methods to create Event-Driven Asynchronous Storage.

Was tested with Angular-applications.

*** 
Also, you can create ReactiveStateful Component by extending Store class. Then you will get component-store with own state$, patch() etc. It is useful if you have Component with a lot of dynamic data.


tags: rxjs redux flux storage state reactive ngrx rx 
