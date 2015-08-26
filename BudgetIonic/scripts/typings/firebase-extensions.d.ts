interface FirebaseDataSnapshot {
	/**
	 * Exports the entire contents of the DataSnapshot as a JavaScript object.
	 */
    exportVal<T>(): T;
}

interface Firebase {
	/**
	 * Atomically modifies the data at this location.
	 */
    transaction<T>(updateFunction: (currentData: T) => T, onComplete?: (error: any, committed: boolean, snapshot: FirebaseDataSnapshot) => void, applyLocally?: boolean): void;
    transaction<T>(updateFunction: (account: T) => any);
}
