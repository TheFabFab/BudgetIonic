interface FirebaseDataSnapshot {
	/**
	 * Exports the entire contents of the DataSnapshot as a JavaScript object.
	 */
    exportVal<T>(): T;

	/**
	 * Generates a new child location using a unique name and returns a Firebase reference to it.
	 * @returns {Firebase} A Firebase reference for the generated location.
	 */
    push<T>(value?: T, onComplete?: (error: any) => void): Firebase;
}

interface Firebase {
	/**
	 * Atomically modifies the data at this location.
	 */
    transaction<T>(updateFunction: (currentData: T) => T, onComplete?: (error: any, committed: boolean, snapshot: FirebaseDataSnapshot) => void, applyLocally?: boolean): void;
    transaction<T>(updateFunction: (account: T) => any);
}
