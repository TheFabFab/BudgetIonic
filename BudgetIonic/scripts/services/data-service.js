var Budget;
(function (Budget) {
    var DataService = (function () {
        function DataService($q, $firebaseArray, aggregatorService) {
            this.$q = $q;
            console.log("Creating data service");
            aggregatorService.start();
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
        }
        DataService.prototype.getRootAccountReference = function () {
            return this.getAccountReference('');
        };
        DataService.prototype.getAccountReference = function (key) {
            console.log("Resolving account for key: " + key);
            var deferred = this.$q.defer();
            if (key === '') {
                var query = this._accountsReference
                    .orderByChild("parent")
                    .equalTo(null);
                query.once('value', function (snapshot) {
                    var child;
                    snapshot.forEach(function (x) { return child = x; });
                    deferred.resolve(child.ref());
                });
            }
            else {
                console.log("Resolving account by key " + key);
                this._accountsReference.child(key).once('value', function (snapshot) {
                    console.log("Resolved account by id:");
                    console.log(snapshot);
                    deferred.resolve(snapshot.ref());
                });
            }
            return deferred.promise;
        };
        DataService.prototype.addAccount = function (subject, parent, description) {
            if (parent === void 0) { parent = null; }
            if (description === void 0) { description = ''; }
            var deferred = this.$q.defer();
            var reference = this._accountsReference.push({
                subject: subject,
                description: description,
                parent: parent,
                credited: 0,
                debited: 0,
                lastAggregationTime: 0,
            }, function (x) {
                deferred.resolve(reference);
            });
            return deferred.promise;
        };
        DataService.prototype.addTransaction = function (transaction) {
            var deferred = this.$q.defer();
            var reference = this._transactionsReference.push(transaction, function (x) {
                deferred.resolve(reference);
            });
            return deferred.promise;
        };
        DataService.prototype.createDemoData = function () {
            var _this = this;
            var deferred = this.$q.defer();
            this.addAccount('My budget', null, 'This is the root node')
                .then(function (rootNode) { return _this.$q.all([
                _this.addAccount('Item1', rootNode.key()),
                _this.addAccount('Item2', rootNode.key()),
                _this.addAccount('Item3', rootNode.key())
                    .then(function (item3) { return _this.$q.all([
                    _this.addAccount('Item3.1', item3.key()),
                    _this.addAccount('Item3.2', item3.key()),
                    _this.addAccount('Item3.3', item3.key()),
                ]); })
            ]).then(function (subitems) {
                _this.$q.all([
                    _this.addTransaction({
                        debit: null,
                        credit: rootNode.key(),
                        amount: 65000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    _this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[0].key(),
                        amount: 25000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    _this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[1].key(),
                        amount: 20000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    _this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[2].key(),
                        amount: 20000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    })
                ]).then(function (x) { return deferred.resolve(); });
            }); });
            return deferred.promise;
        };
        DataService.IID = "dataService";
        DataService.$inject = [
            '$q',
            '$firebaseArray',
            Budget.AggregatorService.IID,
        ];
        return DataService;
    })();
    Budget.DataService = DataService;
})(Budget || (Budget = {}));
//# sourceMappingURL=data-service.js.map