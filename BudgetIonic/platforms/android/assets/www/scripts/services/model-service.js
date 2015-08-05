/// <reference path="../models/budget-item.ts" />
var Budget;
(function (Budget) {
    var ModelService = (function () {
        function ModelService() {
            console.log("ModelService created");
            this.load();
        }
        ModelService.prototype.getBudget = function () {
            return this.budget;
        };
        ModelService.prototype.getBudgetItem = function (id) {
            return this.getBudgetItemCore(this.budget, id);
        };
        ModelService.prototype.getBudgetItemCore = function (budgetItem, id) {
            if (budgetItem.id == id)
                return budgetItem;
            var foundItem = null;
            for (var idx = 0; idx < budgetItem.subitems.length; idx++) {
                foundItem = this.getBudgetItemCore(budgetItem.subitems[idx], id);
                if (foundItem != null)
                    break;
            }
            return foundItem;
        };
        ModelService.prototype.load = function () {
            this.budget = new Budget.BudgetItem(1, "MyBudget", "", 10000, 1000, 9000, [
                new Budget.BudgetItem(2, "Item1", "", 2000, 1000, 1000, [
                    new Budget.BudgetItem(3, "Item1.1", "", 200, 100, 100),
                    new Budget.BudgetItem(4, "Item1.2", "", 200, 100, 100),
                    new Budget.BudgetItem(5, "Item1.3", "", 200, 100, 100),
                ]),
                new Budget.BudgetItem(6, "Item2", "", 2000, 2200, 200, []),
                new Budget.BudgetItem(7, "Item3", "", 2000, 100, 2000, []),
            ]);
        };
        ModelService.IID = "modelService";
        return ModelService;
    })();
    Budget.ModelService = ModelService;
})(Budget || (Budget = {}));
//# sourceMappingURL=model-service.js.map