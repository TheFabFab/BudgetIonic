/// <reference path="../typings/firebase/firebase.d.ts" />
/// <reference path="lite-events.ts" />
/// <reference path="../typings/angularfire/angularfire.d.ts" />
var Budget;
(function (Budget) {
    var Account = (function () {
        function Account(_dataService, _firebaseObject, _snapshot, subAccounts, creditTransactions, debitTransactions) {
            var _this = this;
            this._firebaseObject = _firebaseObject;
            this._snapshot = _snapshot;
            this.subAccounts = subAccounts;
            this.debited = 0;
            this.credited = 0;
            this._key = _snapshot.key();
            creditTransactions.forEach(function (x) { return _this.credited += x.amount; });
            debitTransactions.forEach(function (x) { return _this.debited += x.amount; });
            this._firebaseObject.on('value', function (snapshot) { return _this._snapshot = snapshot; });
            _dataService.newTransactionAvailable().on(function (transaction) { return _this.onNewTransactionAvailable(transaction); });
        }
        Account.prototype.key = function () {
            return this._key;
        };
        Account.prototype.firebaseObject = function () {
            return this._firebaseObject;
        };
        Account.prototype.snapshot = function () {
            return this._snapshot;
        };
        Account.prototype.onNewTransactionAvailable = function (transaction) {
            if (transaction.debit == this._key) {
                this.debited += transaction.amount;
            }
            if (transaction.credit == this._key) {
                this.credited += transaction.amount;
            }
        };
        return Account;
    })();
    Budget.Account = Account;
})(Budget || (Budget = {}));
//# sourceMappingURL=account.js.map