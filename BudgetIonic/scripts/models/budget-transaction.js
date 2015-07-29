var Budget;
(function (Budget) {
    var BudgetTransaction = (function () {
        function BudgetTransaction(_spent, _reduced, _date, _user) {
            if (_date === void 0) { _date = Date.now(); }
            if (_user === void 0) { _user = 'admin'; }
            this._spent = _spent;
            this._reduced = _reduced;
            this._date = _date;
            this._user = _user;
        }
        BudgetTransaction.prototype.spent = function () {
            return this._spent;
        };
        BudgetTransaction.prototype.reduced = function () {
            return this._reduced;
        };
        return BudgetTransaction;
    })();
    Budget.BudgetTransaction = BudgetTransaction;
})(Budget || (Budget = {}));
//# sourceMappingURL=budget-transaction.js.map