/// <reference path="../models/account.ts" />
module Budget {
    export interface ITransactionData {
        debit: string;
        credit: string;
        amount: number;
        timestamp: number;
    }

    export interface IAccountData {
        subject: string;
        description: string;
    }

    export interface IDataService {
        loaded(): ng.IPromise<boolean>;
        getRootAccount(): Account;
    }

    export class DataService implements IDataService {
        public static IID = "dataService";

        public static $inject = [
            '$q',
            '$firebaseArray',
        ];

        private _database: Firebase;
        private _loaded: ng.IPromise<boolean>;
        private _rootAccount: Account;

        private _accountsReference: Firebase;
        private _transactionsReference: Firebase;

        constructor(private $q: ng.IQService, $firebaseArray: AngularFireArrayService) {
            console.log("Creating data service");

            var loadedPromise = $q.defer<boolean>();
            this._loaded = loadedPromise.promise;

            this._database = new Firebase("https://budgetionic.firebaseio.com/");

            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");

            this.loadAccounts()
                .then(rootAccount => {

                if (rootAccount == null) {
                    this.createDemoData()
                        .then(() => {
                            this.loadAccounts().then(rootAccount2 => {
                                console.assert(rootAccount2 != null, "We should have a root account after creating demo data");
                                this._rootAccount = rootAccount;
                                loadedPromise.resolve(true);
                            })
                        });
                } else {
                    loadedPromise.resolve(true);
                    this._rootAccount = rootAccount;
                }
            });
        }

        public loaded(): ng.IPromise<boolean> {
            return this._loaded;
        }

        public getRootAccount(): Account {
            this.assertLoaded();
            return this._rootAccount;
        }
        
        private filterTransactions(creditOrDebit: boolean, accountKey: string): ng.IPromise<ITransactionData[]> {
            var deferred = this.$q.defer<ITransactionData[]>();
            this._transactionsReference
                .orderByChild(creditOrDebit ? "credit" : "debit")
                .equalTo(accountKey)
                .once('value', snapshot => {
                
                var transactions: ITransactionData[] = [];                
                snapshot.forEach(x => transactions.push(<ITransactionData>x.val()));
                deferred.resolve(transactions);
            });
                
            return deferred.promise;
        }
        
        public transactionsReference(): Firebase {
            return this._transactionsReference;
        }

        private assertLoaded(): void {
            console.assert(this._loaded["$$state"] !== undefined, "$q internals changed");
            console.assert(this._loaded["$$state"].value !== undefined, "Controller should be only invoked after data is loaded.");
            console.assert(this._loaded["$$state"].value == true, "Controller should be only invoked if data is loaded successfully.");
        }

        private addAccount(account: IAccountData): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference = this._accountsReference.push(account, x => {
                deferred.resolve(reference);
            });
            return deferred.promise;
        }

        private addTransaction(transaction: ITransactionData): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference = this._transactionsReference.push(transaction, x => {
                deferred.resolve(reference);
            });
            return deferred.promise;
        }

        private loadAccounts(): ng.IPromise<Account> {

            var rootAccountPromise = this.$q.defer<Account>();

            this._accountsReference.orderByChild("parent")
                .equalTo(null)
                .once("value", rootCandidates => {

                if (rootCandidates.hasChildren()) {
                    console.assert(rootCandidates.numChildren() == 1, "Exactly one root account is expected");

                    var root: FirebaseDataSnapshot;
                    rootCandidates.forEach(x => root = x);
                    this.loadAccount(root).then(rootAccount => {
                        rootAccountPromise.resolve(rootAccount);
                    });
                } else {
                    rootAccountPromise.resolve(null);
                }
            });

            return rootAccountPromise.promise;
        }

        private loadAccount(snapshot: FirebaseDataSnapshot): ng.IPromise<Account> {
            var childrenLoaded = this.$q.defer<Account[]>();
                
            this._accountsReference
                .orderByChild("parent")
                .equalTo(snapshot.key())
                .once('value', childrenSnapshot => {

                    var children: ng.IPromise<Account>[] = [];
                    childrenSnapshot.forEach(childSnapshot => {
                        children.push(this.loadAccount(childSnapshot));
                    });

                    this.$q.all(children).then(childAccounts => childrenLoaded.resolve(childAccounts));
                });

            var creditTransactionsDeferred = this.filterTransactions(true, snapshot.key());
            var debitTransactionsDeferred = this.filterTransactions(false, snapshot.key());

            var loadedAccount =                
                this.$q.all(<any[]>[creditTransactionsDeferred, debitTransactionsDeferred, childrenLoaded])
                .then(results => {
                    var creditTransactions = <ITransactionData[]>results[0];
                    var debitTransactions = <ITransactionData[]>results[1];
                    var childAccounts = <Account[]>results[2];
    
                    var firebaseObject: Firebase = this._accountsReference.child(snapshot.key());
                    return new Account(firebaseObject, snapshot, childAccounts, creditTransactions, debitTransactions);
                });

            return loadedAccount;
        }

        private createDemoData(): ng.IPromise<{}> {
            var deferred = this.$q.defer();

            this.addAccount({
                subject: 'My budget',
                description: 'This is the root node',
                parent: null
            }).then(rootNode => this.$q.all([
                this.addAccount({
                    subject: 'Item1',
                    description: '',
                    parent: rootNode.key()
                }),
                this.addAccount({
                    subject: 'Item2',
                    description: '',
                    parent: rootNode.key()
                }),
                this.addAccount({
                    subject: 'Item3',
                    description: '',
                    parent: rootNode.key()
                })
            ]).then(subitems => {
                this.$q.all([
                    this.addTransaction({
                        debit: null,
                        credit: rootNode.key(),
                        amount: 65000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[0].key(),
                        amount: 25000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[1].key(),
                        amount: 20000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[2].key(),
                        amount: 20000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    })
                ]).then(x => deferred.resolve());
            }));

            return deferred.promise;
        }
    }
}