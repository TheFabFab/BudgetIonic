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

        private load() {
            this.budget = new BudgetItem("MyBudget", "", 10000, 1000, 9000, [
                new BudgetItem("Item1", "", 2000, 1000, 1000, [
                    new BudgetItem("Item1.1", "", 200, 100, 100),
                    new BudgetItem("Item1.2", "", 200, 100, 100),
                    new BudgetItem("Item1.3", "", 200, 100, 100),
                ]),
                new BudgetItem("Item2", "", 2000, 2200, 200, [
                ]),
                new BudgetItem("Item3", "", 2000, 100, 2000, [
                ]),
            ]);
        }
    }
}