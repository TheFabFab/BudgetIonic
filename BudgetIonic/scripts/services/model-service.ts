/// <reference path="../models/budget-item.ts" />

module Budget {
    export class ModelService {

        public static IID = "modelService";
        private budget: BudgetItem;

        constructor() {
            console.log("ModelService created");
            this.load();
        }

        public getBudget(): BudgetItem {
            return this.budget;
        }

        public getBudgetItem(id: number) {
            return this.getBudgetItemCore(this.budget, id);
        }

        private getBudgetItemCore(budgetItem: BudgetItem, id: number) {
            if (budgetItem.id == id) return budgetItem;

            var foundItem = null;

            for (var idx = 0; idx < budgetItem.subitems.length; idx++) {
                foundItem = this.getBudgetItemCore(budgetItem.subitems[idx], id);
                if (foundItem != null) break;
            }

            return foundItem;
        }

        private load() {
            this.budget = new BudgetItem(1, "MyBudget", "", 10000, 1000, 9000, [
                new BudgetItem(2, "Item1", "", 2000, 1000, 1000, [
                    new BudgetItem(3, "Item1.1", "", 200, 100, 100),
                    new BudgetItem(4, "Item1.2", "", 200, 100, 100),
                    new BudgetItem(5, "Item1.3", "", 200, 100, 100),
                ]),
                new BudgetItem(6, "Item2", "", 2000, 2200, 200, [
                ]),
                new BudgetItem(7, "Item3", "", 2000, 100, 2000, [
                ]),
            ]);
        }
    }
}