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
        parent: string;
        debited: number;
        credited: number;
        lastAggregationTime: number;
    }

    export interface IDataService {
        getAccountReference(key: string): ng.IPromise<Firebase>;
        getRootAccountReference(): ng.IPromise<Firebase>;
    }

    export class DataService implements IDataService {
        public static IID = "dataService";

        public static $inject = [
            '$q',
            '$firebaseArray',
            AggregatorService.IID,
        ];

        private _database: Firebase;

        private _accountsReference: Firebase;
        private _transactionsReference: Firebase;

        constructor(private $q: ng.IQService, $firebaseArray: AngularFireArrayService, aggregatorService: AggregatorService) {
            console.log("Creating data service");

            aggregatorService.start();

            this._database = new Firebase("https://budgetionic.firebaseio.com/");

            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
        }

        public getRootAccountReference(): ng.IPromise<Firebase> {
            return this.getAccountReference('');
        }

        public getAccountReference(key: string): ng.IPromise<Firebase> {
            console.log("Resolving account for key: " + key);
            
            if (key == 'root') {
                key = '';
            }

            var deferred = this.$q.defer<Firebase>();

            if (key === '') {
                var query =
                    this._accountsReference
                        .orderByChild("parent")
                        .equalTo(null);

                query.once('value', snapshot => {
                    var child: FirebaseDataSnapshot;
                    snapshot.forEach(x => child = x);
                    deferred.resolve(child.ref());
                });
            } else {
                console.log("Resolving account by key " + key);
                this._accountsReference.child(key).once(
                    'value', snapshot => {
                        console.log("Resolved account by id:");
                        console.log(snapshot);
                        deferred.resolve(snapshot.ref());
                });
            }

            return deferred.promise;
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

        private addTransaction(transaction: ITransactionData): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference = this._transactionsReference.push(transaction, x => {
                deferred.resolve(reference);
            });
            return deferred.promise;
        }

        private createDemoData(): ng.IPromise<{}> {
            var deferred = this.$q.defer();

            this.addAccount('My budget', null, 'This is the root node')
                .then(rootNode => this.$q.all<Firebase>([
                this.addAccount('Item1', rootNode.key()),
                this.addAccount('Item2', rootNode.key()),
                this.addAccount('Item3', rootNode.key())
                    .then(item3 => this.$q.all<Firebase>([
                        this.addAccount('Item3.1', item3.key()),
                        this.addAccount('Item3.2', item3.key()),
                        this.addAccount('Item3.3', item3.key()),
                    ]))
            ]).then(subitems => {
                this.$q.all<Firebase>([
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