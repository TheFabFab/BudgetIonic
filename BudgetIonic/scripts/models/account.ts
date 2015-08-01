/// <reference path="../typings/firebase/firebase.d.ts" />
/// <reference path="lite-events.ts" />
/// <reference path="../typings/angularfire/angularfire.d.ts" />

module Budget {
    export class Account {
        private _debited: number = 0;
        private _credited: number = 0;
        
        private _directDebited: number = 0;
        private _directCredited: number = 0;

        private _changedEvent = new LiteEvent<Account>();

        constructor(
            private _firebaseObject: Firebase, 
            private _snapshot: FirebaseDataSnapshot, 
            public subAccounts: Account[],
            creditTransactions: ITransactionData[],
            debitTransactions: ITransactionData[]) {
                
            creditTransactions.forEach(x => this._directCredited += x.amount);
            debitTransactions.forEach(x => this._directDebited += x.amount);

            this._firebaseObject.on('value', snapshot => this._snapshot = snapshot);
            subAccounts.forEach(subAccount => {
                subAccount._changedEvent.on(child => this.onChildChanged(child));
            });

            this.recalculate();
        }

        public firebaseObject(): Firebase {
            return this._firebaseObject;
        }

        public snapshot(): FirebaseDataSnapshot {
            return this._snapshot;
        }

        public debited(): number {
            return this._debited;
        }

        public credited(): number {
            return this._credited;
        }

        protected onChanged() {
            this._changedEvent.trigger(this);
        }

        protected onChildChanged(child: Account) {
            this.recalculate();
        }

        private recalculate() {
            var credited = this._directCredited;
            var debited = this._directDebited;

            this.subAccounts.forEach(subAccount => {
                credited += subAccount.credited();
                debited += subAccount.debited();
            });

            if (credited != this._credited ||
                debited != this._debited) {
                this._credited = credited;
                this._debited = debited;
                this.onChanged();
            }
        }
    }
}