/// <reference path="../constants.ts" />
/// <reference path="../models/server-interfaces.ts" />
module Budget {

    export interface IDataService {
        getAccountSnapshot(key: string): ng.IPromise<FirebaseDataSnapshot>;
        getRootAccountSnapshot(): ng.IPromise<FirebaseDataSnapshot>;
        addChildAccount(parentKey: string, subject: string, description: string): ng.IPromise<any>;
        deleteAccount(accountId: string): ng.IPromise<any>;
        addTransaction(transaction: ITransactionData): ng.IPromise<any>;
        getAccountsReference(): Firebase;
        getTransactionsReference(): Firebase;
    }

    export class AccountData implements IAccountData {
        constructor(
            public subject: string,
            public description: string,
            public parent: string,
            public debited: number,
            public credited: number,
            public lastAggregationTime: number,
            public key: string) {
        }

        public static copy(other: IAccountData, key: string): AccountData {
            return new AccountData(
                other.subject,
                other.description,
                other.parent,
                other.debited,
                other.credited,
                other.lastAggregationTime,
                key);
        }

    }

    export class DataService implements IDataService {
        public static IID = "dataService";

        public static $inject = [
            '$q',
            '$firebaseArray',
        ];

        private _database: Firebase;

        private _accountsReference: Firebase;
        private _transactionsReference: Firebase;

        constructor(private $q: ng.IQService, $firebaseArray: AngularFireArrayService) {
            console.log("Creating data service");

            this._database = new Firebase("https://budgetionic.firebaseio.com/");

            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");

            this.ensureData();
        }

        private ensureData() {
            this._accountsReference
                .orderByChild("parent")
                .limitToFirst(1)
                .once(
                    FirebaseEvents.value,
                    snapshot => {
                        if (!snapshot.val()) {
                            this.createDemoData();
                        }
                    });
        }

        public getAccountsReference(): Firebase {
            return this._accountsReference;
        }

        public getTransactionsReference(): Firebase {
            return this._transactionsReference;
        }

        public getRootAccountSnapshot(): ng.IPromise<FirebaseDataSnapshot> {
            return this.getAccountSnapshot('');
        }

        public getAccountSnapshot(key: string): ng.IPromise<FirebaseDataSnapshot> {
            console.log("Resolving account for key: " + key);

            if (key == 'root') {
                key = '';
            }

            var deferred = this.$q.defer<FirebaseDataSnapshot>();

            if (key === '') {
                var query =
                    this._accountsReference
                        .orderByChild("parent")
                        .equalTo('');

                query.once(FirebaseEvents.value, snapshot => {
                    var child: FirebaseDataSnapshot;
                    snapshot.forEach(x => child = x);
                    if (child) {
                        deferred.resolve(child);
                    } else {
                        deferred.reject();
                    }
                });
            } else {
                console.log("Resolving account by key " + key);
                this._accountsReference.child(key).once(
                    FirebaseEvents.value,
                    snapshot => {
                        console.log("Resolved account by id:");
                        console.log(snapshot);
                        deferred.resolve(snapshot);
                    });
            }

            return deferred.promise;
        }

        public addChildAccount(parentKey: string, subject: string, description: string): ng.IPromise<any> {
            var deferred = this.$q.defer();

            this.normalizeAccountKey(parentKey)
                .then(key => {
                    this._accountsReference.push(<IAccountData>{
                        subject: subject,
                        description: description,
                        parent: key,
                        debited: 0,
                        credited: 0,
                        lastAggregationTime: 0,
                    },
                    error => {
                        if (error == null) deferred.resolve();
                        else deferred.reject(error);
                    });
                });

            return deferred.promise;
        }

        public deleteAccount(accountId: string): ng.IPromise<any> {
            var deferred = this.$q.defer();

            this.getAccountSnapshot(accountId)
                .then(accountReference => {
                    accountReference.ref().remove(error => {
                        if (error) deferred.reject(error);
                        else deferred.resolve();
                    });
                });

            return deferred.promise;
        }

        private normalizeAccountKey(accountKey: string): ng.IPromise<string> {
            var accountKeyDeferred = this.$q.defer();

            if (accountKey == 'root') {
                accountKey = '';
            }

            if (accountKey == '') {
                this.getRootAccountSnapshot().then(x => accountKeyDeferred.resolve(x.key()));
            }
            else {
                accountKeyDeferred.resolve(accountKey);
            }

            return accountKeyDeferred.promise;
        }

        private addAccount(subject: string, parent: string = null, description: string = ''): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference = this._accountsReference.push(<IAccountData>{
                subject: subject,
                description: description,
                parent: parent,
                credited: 0,
                debited: 0,
                lastAggregationTime: 0,
            }, x => {
                deferred.resolve(reference);
            });
            return deferred.promise;
        }

        public addTransaction(transaction: ITransactionData): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference = this._transactionsReference.push(transaction, x => {
                deferred.resolve(reference);
            });
            return deferred.promise;
        }

        private createDemoData(): ng.IPromise<{}> {
            var deferred = this.$q.defer();

            console.log("Creating demo data...");

            this.addAccount('My budget', '', 'This is the root node')
                .then(rootNode => this.$q.all<Firebase>([
                    this.addAccount('Item1', rootNode.key()),
                    this.addAccount('Item2', rootNode.key()),
                    this.addAccount('Item3', rootNode.key())
                        .then(item3 => {
                            this.$q.all<Firebase>([
                                this.addAccount('Item3.1', item3.key()),
                                this.addAccount('Item3.2', item3.key()),
                                this.addAccount('Item3.3', item3.key()),
                            ]);

                            return item3;
                        })
                ])
                .then(subitems => {
                this.$q.all<Firebase>([
                    this.addTransaction({
                        debit: null,
                        debitAccountName: '',
                        credit: rootNode.key(),
                        creditAccountName: 'My budget',
                        amount: 65000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        debitAccountName: 'My budget',
                        credit: subitems[0].key(),
                        creditAccountName: 'Item1',
                        amount: 25000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        debitAccountName: 'My budget',
                        credit: subitems[1].key(),
                        creditAccountName: 'Item2',
                        amount: 20000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        debitAccountName: 'My budget',
                        credit: subitems[2].key(),
                        creditAccountName: 'Item3',
                        amount: 10000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    })
                ]).then(x => deferred.resolve());
            }));

            return deferred.promise;
        }
    }
}