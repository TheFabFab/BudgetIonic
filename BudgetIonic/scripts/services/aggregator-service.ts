module Budget {
    class AccountAggregate {
        constructor(
            public accountSnapshot: FirebaseDataSnapshot,
            public credited: number = 0,
            public debited: number = 0,
            public lastAggregationTime: number = 0) {

            if (this.lastAggregationTime == 0) {
                var account: IAccountData = accountSnapshot.val();
                this.credited = account.credited;
                this.debited = account.debited;
                this.lastAggregationTime = account.lastAggregationTime;
            }
        }

        public aggregate(transaction: ITransactionData): AccountAggregate {

            var snapshot = this.accountSnapshot;
            var credited = this.credited + (transaction.credit == snapshot.key() ? transaction.amount : 0);
            var debited = this.debited + (transaction.debit == snapshot.key() ? transaction.amount : 0);
            var aggregationTime = (transaction.timestamp > this.lastAggregationTime) ? transaction.timestamp : this.lastAggregationTime;

            return new AccountAggregate(snapshot, credited, debited, aggregationTime);
        }
    };

    export class AggregatorService {
        public static IID = "aggregatorService";

        public static $inject = [
            "$log",
            '$timeout',
        ];

        private _database: Firebase;
        private _accountsReference: Firebase;
        private _transactionsReference: Firebase;
        private _accountMap: FirebaseDataSnapshot[] = [];
        private _accountsToAggregate: AccountAggregate[] = [];

        constructor(private $log: ng.ILogService, private $timeout: ng.ITimeoutService) {
            this._database = new Firebase("https://budgetionic.firebaseio.com/");

            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
        }

        public start() {
            this.$log.debug("Starting aggregator service");

            this._accountsReference.on('child_added', accountSnapshot => {
                this.$log.debug("Received account", accountSnapshot.val());
                this._accountMap[accountSnapshot.key()] = accountSnapshot;
            });

            this._transactionsReference.on('child_added', transactionSnapshot => {
                var transaction: ITransactionData = transactionSnapshot.val();
                this.$log.debug("Transaction received", transaction);

                var relatedAccounts: FirebaseDataSnapshot[] =
                    [this._accountMap[transaction.debit], this._accountMap[transaction.credit]];

                relatedAccounts
                    .forEach(accountSnapshot => {
                        if (accountSnapshot != null) {
                            var account: IAccountData = accountSnapshot.val();
                            if (account.lastAggregationTime < transaction.timestamp) {
                                this.$log.info("Account " + account.subject + " is not aggregated");
                                var previous: AccountAggregate =
                                    this._accountsToAggregate[accountSnapshot.key()] ||
                                    new AccountAggregate(accountSnapshot);
                                
                                this._accountsToAggregate[accountSnapshot.key()] = previous.aggregate(transaction);
                                this.$timeout(() => this.updateAccounts());
                            }
                        }
                    });
            });
        }

        private updateAccounts() {
            var logged = false;

            for (var property in this._accountsToAggregate) {
                if (this._accountsToAggregate.hasOwnProperty(property)) {
                    if (!logged) {
                        this.$log.debug("Preparing to update accounts:", this._accountsToAggregate);
                        logged = true;
                    }

                    var aggregate = this._accountsToAggregate[property];
                    aggregate.accountSnapshot.ref().update({
                        credited: aggregate.credited,
                        debited: aggregate.debited,
                        lastAggregationTime: aggregate.lastAggregationTime,
                    });

                    delete this._accountsToAggregate[property];
                }
            }
        }
    }
}