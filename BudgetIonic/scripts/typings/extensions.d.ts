/// <reference path="../../typings/rx/rx.d.ts" />
declare module angular {
    interface IQService {
        /**
         * Combines multiple promises into a single promise that is resolved when all of the input promises are resolved.
         *
         * Returns a single promise that will be resolved with an array of values, each value corresponding to the promise at the same index in the promises array. If any of the promises is resolved with a rejection, this resulting promise will be rejected with the same rejection value.
         *
         * @param promises An array of promises.
         */
        all<TResult>(promises: IPromise<TResult>[]): IPromise<TResult[]>;
    }
}

interface AngularFireArrayService {
    (firebaseQuery: FirebaseQuery): AngularFireArray;
}

declare module Rx {
    interface Observable<T> {
        first(): Observable<T>;
        first(predicate: (item: T) => boolean): Observable<T>;
    }
}