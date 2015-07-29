/// <reference path="../typings/underscore-observable-arrays/underscore-observable-arrays.d.ts" />
/// <reference path="budget-transaction.ts" />
/// <reference path="lite-events.ts" />
var Budget;
(function (Budget) {
    var BudgetItem = (function () {
        function BudgetItem(id, subject, description, planned, spent, remaining, subitems, transactions) {
            var _this = this;
            if (subitems === void 0) { subitems = []; }
            if (transactions === void 0) { transactions = []; }
            this.id = id;
            this.subject = subject;
            this.description = description;
            this.planned = planned;
            this.spent = spent;
            this.remaining = remaining;
            this.subitems = subitems;
            this.transactions = transactions;
            this.changed = new Budget.LiteEvent();
            _.observe(transactions, function (new_array, old_array) { return _this.transactionsUpdated(new_array, old_array); });
            _.observe(subitems, function (new_array, old_array) { return _this.subitemsUpdated(new_array, old_array); });
            this.subitems.forEach(function (x) { return x.changed.on(function (child) { return _this.onChildChanged(child); }); });
            this.recalculate();
        }
        BudgetItem.prototype.calculateProgressPath = function () {
            var alpha = 2 * Math.PI * this.progress / 100;
            var x = 40 + 35 * Math.sin(alpha);
            var y = 40 - 35 * Math.cos(alpha);
            var largeArcFlag = this.progress > 50 ? 1 : 0;
            this.progressPath = 'M40,5 A35,35 0 ' + largeArcFlag + ',1 ' + x + ',' + y;
            this.xArcEnd = x;
            this.yArcEnd = y;
        };
        BudgetItem.prototype.getAllTransactions = function () {
            var allTransactions = this.transactions.map(function (x) { return x; });
            return allTransactions;
        };
        BudgetItem.prototype.recalculate = function () {
            var spent = 0;
            var remaining = 0;
            this.transactions.forEach(function (x) {
                spent += x.spent();
                remaining += -x.reduced;
            });
            this.subitems.forEach(function (x) {
                spent += x.spent;
                remaining += x.remaining;
            });
            var changed = this.spent != spent || this.remaining != remaining;
            if (changed) {
                this.spent = spent;
                this.remaining = remaining;
                this.changed.trigger(this);
            }
            this.progress = Math.round(100 * this.spent / (this.spent + this.remaining));
            this.prediction = Math.round(100 * (this.spent + this.remaining) / this.planned);
            this.calculateProgressPath();
        };
        BudgetItem.prototype.transactionsUpdated = function (new_array, old_array) {
            this.recalculate();
        };
        BudgetItem.prototype.subitemsUpdated = function (new_array, old_array) {
            this.recalculate();
        };
        BudgetItem.prototype.onChildChanged = function (child) {
            this.recalculate();
        };
        return BudgetItem;
    })();
    Budget.BudgetItem = BudgetItem;
})(Budget || (Budget = {}));
//# sourceMappingURL=budget-item.js.map