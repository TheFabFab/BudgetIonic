/// <reference path="../typings/firebase/firebase.d.ts" />
/// <reference path="lite-events.ts" />
/// <reference path="../typings/angularfire/angularfire.d.ts" />

module Budget {
    export class Account {
        public debited: number = 0;
        public credited: number = 0;

        private _key: string;

        constructor(
            _dataService: IDataService,
            private _firebaseObject: Firebase, 
            private _snapshot: FirebaseDataSnapshot, 
            public subAccounts: Account[],
            creditTransactions: ITransactionData[],
            debitTransactions: ITransactionData[]) {
                
            this._key = _snapshot.key();

            creditTransactions.forEach(x => this.credited += x.amount);
            debitTransactions.forEach(x => this.debited += x.amount);

            this._firebaseObject.on('value', snapshot => this._snapshot = snapshot);

            _dataService.newTransactionAvailable().on(transaction => this.onNewTransactionAvailable(transaction));
        }

        public key(): string {
            return this._key;
        }

        public firebaseObject(): Firebase {
            return this._firebaseObject;
        }

        public snapshot(): FirebaseDataSnapshot {
            return this._snapshot;
        }

        private onNewTransactionAvailable(transaction: ITransactionData) {
            if (transaction.debit == this._key) {
                this.debited += transaction.amount;
            }
            if (transaction.credit == this._key) {
                this.credited += transaction.amount;
            }
        }
    }
}