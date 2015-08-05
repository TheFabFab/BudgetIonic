/// <reference path="../models/account.ts" />
/// <reference path="../models/lite-events.ts" />
var Budget;
(function (Budget) {
    var DataService = (function () {
        function DataService($q, $firebaseArray) {
            var _this = this;
            this.$q = $q;
            this._accountMap = [];
            this._newTransactionAvailable = new Budget.LiteEvent();
            console.log("Creating data service");
            var loadedPromise = $q.defer();
            this._loaded = loadedPromise.promise;
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
            this._transactionsReference.on('child_added', function (dataSnapshot, prevChildName) {
                _this.onTransactionAdded(dataSnapshot, prevChildName);
            });
            this.loadAccounts()
                .then(function (rootAccount) {
                if (rootAccount == null) {
                    _this.createDemoData()
                        .then(function () {
                        _this.loadAccounts().then(function (rootAccount2) {
                            console.assert(rootAccount2 != null, "We should have a root account after creating demo data");
                            _this._rootAccount = rootAccount;
                            loadedPromise.resolve(true);
                        });
                    });
                }
                else {
                    loadedPromise.resolve(true);
                    _this._rootAccount = rootAccount;
                }
            });
        }
        DataService.prototype.loaded = function () {
            return this._loaded;
        };
        DataService.prototype.getRootAccount = function () {
            this.assertLoaded();
            return this._rootAccount;
        };
        DataService.prototype.getAccount = function (key) {
            this.assertLoaded();
            return this._accountMap[key];
        };
        DataService.prototype.newTransactionAvailable = function () {
            return this._newTransactionAvailable;
        };
        DataService.prototype.onTransactionAdded = function (dataSnapshot, prevChildName) {
            var transaction = dataSnapshot.val();
            this._newTransactionAvailable.trigger(transaction);
        };
        DataService.prototype.filterTransactions = function (creditOrDebit, accountKey) {
            var deferred = this.$q.defer();
            this._transactionsReference
                .orderByChild(creditOrDebit ? "credit" : "debit")
                .equalTo(accountKey)
                .once('value', function (snapshot) {
                var transactions = [];
                snapshot.forEach(function (x) { return transactions.push(x.val()); });
                deferred.resolve(transactions);
            });
            return deferred.promise;
        };
        DataService.prototype.transactionsReference = function () {
            return this._transactionsReference;
        };
        DataService.prototype.assertLoaded = function () {
            console.assert(this._loaded["$$state"] !== undefined, "$q internals changed");
            console.assert(this._loaded["$$state"].value !== undefined, "Controller should be only invoked after data is loaded.");
            console.assert(this._loaded["$$state"].value == true, "Controller should be only invoked if data is loaded successfully.");
        };
        DataService.prototype.addAccount = function (account) {
            var deferred = this.$q.defer();
            var reference = this._accountsReference.push(account, function (x) {
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
        DataService.prototype.loadAccounts = function () {
            var _this = this;
            var rootAccountPromise = this.$q.defer();
            this._accountsReference.orderByChild("parent")
                .equalTo(null)
                .once("value", function (rootCandidates) {
                if (rootCandidates.hasChildren()) {
                    console.assert(rootCandidates.numChildren() == 1, "Exactly one root account is expected");
                    var root;
                    rootCandidates.forEach(function (x) { return root = x; });
                    _this.loadAccount(root).then(function (rootAccount) {
                        rootAccountPromise.resolve(rootAccount);
                    });
                }
                else {
                    rootAccountPromise.resolve(null);
                }
            });
            return rootAccountPromise.promise;
        };
        DataService.prototype.loadAccount = function (snapshot) {
            var _this = this;
            var childrenLoaded = this.$q.defer();
            this._accountsReference
                .orderByChild("parent")
                .equalTo(snapshot.key())
                .once('value', function (childrenSnapshot) {
                var children = [];
                childrenSnapshot.forEach(function (childSnapshot) {
                    children.push(_this.loadAccount(childSnapshot));
                });
                _this.$q.all(children).then(function (childAccounts) { return childrenLoaded.resolve(childAccounts); });
            });
            var creditTransactionsDeferred = this.filterTransactions(true, snapshot.key());
            var debitTransactionsDeferred = this.filterTransactions(false, snapshot.key());
            var loadedAccount = this.$q.all([creditTransactionsDeferred, debitTransactionsDeferred, childrenLoaded])
                .then(function (results) {
                var creditTransactions = results[0];
                var debitTransactions = results[1];
                var childAccounts = results[2];
                var firebaseObject = _this._accountsReference.child(snapshot.key());
                var account = new Budget.Account(_this, firebaseObject, snapshot, childAccounts, creditTransactions, debitTransactions);
                _this._accountMap[snapshot.key()] = account;
                return account;
            });
            return loadedAccount;
        };
        DataService.prototype.createDemoData = function () {
            var _this = this;
            var deferred = this.$q.defer();
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
        ];
        return DataService;
    })();
    Budget.DataService = DataService;
})(Budget || (Budget = {}));
//# sourceMappingURL=data-service.js.map