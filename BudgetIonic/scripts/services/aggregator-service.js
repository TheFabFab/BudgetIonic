var Budget;
(function (Budget) {
    var AccountAggregate = (function () {
        function AccountAggregate(accountSnapshot, credited, debited, lastAggregationTime) {
            if (credited === void 0) { credited = 0; }
            if (debited === void 0) { debited = 0; }
            if (lastAggregationTime === void 0) { lastAggregationTime = 0; }
            this.accountSnapshot = accountSnapshot;
            this.credited = credited;
            this.debited = debited;
            this.lastAggregationTime = lastAggregationTime;
            if (this.lastAggregationTime == 0) {
                var account = accountSnapshot.val();
                this.credited = account.credited;
                this.debited = account.debited;
                this.lastAggregationTime = account.lastAggregationTime;
            }
        }
        AccountAggregate.prototype.aggregate = function (transaction) {
            var snapshot = this.accountSnapshot;
            var credited = this.credited + (transaction.credit == snapshot.key() ? transaction.amount : 0);
            var debited = this.debited + (transaction.debit == snapshot.key() ? transaction.amount : 0);
            var aggregationTime = (transaction.timestamp > this.lastAggregationTime) ? transaction.timestamp : this.lastAggregationTime;
            return new AccountAggregate(snapshot, credited, debited, aggregationTime);
        };
        return AccountAggregate;
    })();
    ;
    var AggregatorService = (function () {
        function AggregatorService($log, $timeout) {
            this.$log = $log;
            this.$timeout = $timeout;
            this._accountMap = [];
            this._accountsToAggregate = [];
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
        }
        AggregatorService.prototype.start = function () {
            var _this = this;
            this.$log.debug("Starting aggregator service");
            this._accountsReference.on('child_added', function (accountSnapshot) {
                _this.$log.debug("Received account", accountSnapshot.val());
                _this._accountMap[accountSnapshot.key()] = accountSnapshot;
            });
            this._transactionsReference.on('child_added', function (transactionSnapshot) {
                var transaction = transactionSnapshot.val();
                _this.$log.debug("Transaction received", transaction);
                var relatedAccounts = [_this._accountMap[transaction.debit], _this._accountMap[transaction.credit]];
                relatedAccounts
                    .forEach(function (accountSnapshot) {
                    if (accountSnapshot != null) {
                        var account = accountSnapshot.val();
                        if (account.lastAggregationTime < transaction.timestamp) {
                            _this.$log.info("Account " + account.subject + " is not aggregated");
                            var previous = _this._accountsToAggregate[accountSnapshot.key()] ||
                                new AccountAggregate(accountSnapshot);
                            _this._accountsToAggregate[accountSnapshot.key()] = previous.aggregate(transaction);
                            _this.$timeout(function () { return _this.updateAccounts(); });
                        }
                    }
                });
            });
        };
        AggregatorService.prototype.updateAccounts = function () {
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
        };
        AggregatorService.IID = "aggregatorService";
        AggregatorService.$inject = [
            "$log",
            '$timeout',
        ];
        return AggregatorService;
    })();
    Budget.AggregatorService = AggregatorService;
})(Budget || (Budget = {}));
//# sourceMappingURL=aggregator-service.js.map