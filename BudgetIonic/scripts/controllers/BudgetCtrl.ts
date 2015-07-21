/// <reference path="../services/model-service.ts" />

module Budget {
    'use strict';

    export class BudgetCtrl {
        public static $inject = [
            '$scope',
            '$location',
            ModelService.IID
        ];

        public static IID = "budgetCtrl";

        public budget: BudgetItem;

        constructor(private $scope, private $location: ng.ILocationService, private modelService: ModelService) {
            this.budget = modelService.getBudget();
            console.log("BudgetCtrl created with " + this.budget.subject + " containing " + this.budget.subitems.length + " items.");

            $scope.budget = this.budget;
            $scope.onClick = this.onClick;
        }

        private onClick(subitem: BudgetItem) {
            console.log("Subitem clicked:" + subitem.subject);
        }
    }
}