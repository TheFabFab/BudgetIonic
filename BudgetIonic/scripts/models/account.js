/// <reference path="../typings/firebase/firebase.d.ts" />
/// <reference path="lite-events.ts" />
/// <reference path="../typings/angularfire/angularfire.d.ts" />
var Budget;
(function (Budget) {
    var Account = (function () {
        function Account(_firebaseObject, _snapshot, subAccounts, creditTransactions, debitTransactions) {
            var _this = this;
            this._firebaseObject = _firebaseObject;
            this._snapshot = _snapshot;
            this.subAccounts = subAccounts;
            this._debited = 0;
            this._credited = 0;
            this._directDebited = 0;
            this._directCredited = 0;
            this._changedEvent = new Budget.LiteEvent();
            creditTransactions.forEach(function (x) { return _this._directCredited += x.amount; });
            debitTransactions.forEach(function (x) { return _this._directDebited += x.amount; });
            this._firebaseObject.on('value', function (snapshot) { return _this._snapshot = snapshot; });
            subAccounts.forEach(function (subAccount) {
                subAccount._changedEvent.on(function (child) { return _this.onChildChanged(child); });
            });
        }
        Account.prototype.firebaseObject = function () {
            return this._firebaseObject;
        };
        Account.prototype.snapshot = function () {
            return this._snapshot;
        };
        Account.prototype.debited = function () {
            return this._debited;
        };
        Account.prototype.credited = function () {
            return this._credited;
        };
        Account.prototype.onChanged = function () {
            this._changedEvent.trigger(this);
        };
        Account.prototype.onChildChanged = function (child) {
            this.recalculate();
        };
        Account.prototype.recalculate = function () {
            var credited = this._directCredited;
            var debited = this._directDebited;
            this.subAccounts.forEach(function (subAccount) {
                credited += subAccount.credited();
                debited += subAccount.debited();
            });
            if (credited != this._credited ||
                debited != this._debited) {
                this._credited = credited;
                this._debited = debited;
                this.onChanged();
            }
        };
        return Account;
    })();
    Budget.Account = Account;
})(Budget || (Budget = {}));
//# sourceMappingURL=account.js.map