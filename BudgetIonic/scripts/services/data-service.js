var Budget;
(function (Budget) {
    var DataService = (function () {
        function DataService($q, $firebaseArray) {
            var _this = this;
            this.$q = $q;
            console.log("Creating data service");
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            var transactionsReference = this._database.child("transactions");
            this._transactions = $firebaseArray(transactionsReference);
            var accountsReference = this._database.child("accounts");
            this._accounts = $firebaseArray(accountsReference);
            $q.all([this._transactions.$loaded(), this._accounts.$loaded()])
                .then(function (result) {
                if (_this._accounts.length == 0) {
                    _this.createDemoData();
                }
            });
        }
        DataService.prototype.transactions = function () {
            return this._transactions;
        };
        DataService.prototype.accounts = function () {
            return this._accounts;
        };
        DataService.prototype.getRootAccountKey = function () {
            return this._accounts[0].$id;
        };
        DataService.prototype.addAccount = function (account) {
            return this._accounts.$add(account);
        };
        DataService.prototype.addTransaction = function (transaction) {
            return this._transactions.$add(transaction);
        };
        DataService.prototype.createDemoData = function () {
            var _this = this;
            this.addAccount({
                subject: 'My budget',
                description: 'This is the root node',
                parent: null
            }).then(function (rootNode) { return _this.$q.all([
                _this.addAccount({
                    subject: 'Item1',
                    description: '',
                    parent: rootNode.key()
                }),
                _this.addAccount({
                    subject: 'Item2',
                    description: '',
                    parent: rootNode.key()
                }),
                _this.addAccount({
                    subject: 'Item3',
                    description: '',
                    parent: rootNode.key()
                })
            ]).then(function (subitems) {
                _this.addTransaction({
                    debit: null,
                    credit: rootNode.key(),
                    amount: 65000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                _this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[0].key(),
                    amount: 25000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                _this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[1].key(),
                    amount: 20000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                _this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[2].key(),
                    amount: 20000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
            }); });
        };
        DataService.IID = "dataService";
        DataService.$inject = [
            '$q',
            '$firebaseArray',
        ];
        return DataService;
    })();
    Budget.DataService = DataService;
})(Budget || (Budget = {}));
//# sourceMappingURL=data-service.js.map