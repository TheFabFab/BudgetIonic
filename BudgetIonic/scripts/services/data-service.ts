module Budget {
    export interface ITransaction {
        debit: string;
        credit: string;
        amount: number;
        timestamp: number;
    }

    export interface IAccount {
        subject: string;
        description: string;
    }

    export interface IDataService {
        transactions(): AngularFireArray;
        accounts(): AngularFireArray;
        getRootAccountKey(): string;
    }

    export class DataService implements IDataService {
        public static IID = "dataService";

        public static $inject = [
            '$q',
            '$firebaseArray',
        ];

        private _database: Firebase;
        private _transactions: AngularFireArray;
        private _accounts: AngularFireArray;

        constructor(private $q: ng.IQService, $firebaseArray: AngularFireArrayService) {
            console.log("Creating data service");
            this._database = new Firebase("https://budgetionic.firebaseio.com/")

            var transactionsReference = this._database.child("transactions");
            this._transactions = $firebaseArray(transactionsReference);
            var accountsReference = this._database.child("accounts");
            this._accounts = $firebaseArray(accountsReference);

            $q.all([this._transactions.$loaded(), this._accounts.$loaded()])
                .then(result => {
                    if (this._accounts.length == 0) {
                        this.createDemoData();
                    }
                });
        }

        public transactions(): AngularFireArray {
            return this._transactions;
        }

        public accounts(): AngularFireArray {
            return this._accounts;
        }

        public getRootAccountKey(): string {
            return this._accounts[0].$id;
        }

        private addAccount(account: IAccount): ng.IPromise<Firebase> {
            return this._accounts.$add(account);
        }

        private addTransaction(transaction: ITransaction): ng.IPromise<Firebase> {
            return this._transactions.$add(transaction);
        }

        private createDemoData(): void {
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
                this.addTransaction({
                    debit: null,
                    credit: rootNode.key(),
                    amount: 65000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[0].key(),
                    amount: 25000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[1].key(),
                    amount: 20000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[2].key(),
                    amount: 20000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
            }));
        }
    }
}