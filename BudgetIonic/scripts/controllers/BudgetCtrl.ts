/// <reference path="../services/model-service.ts" />

module Budget {
    'use strict';

    export class BudgetCtrl {
        public static $inject = [
            '$scope',
            "$stateParams",
            '$location',
            ModelService.IID
        ];

        public static IID = "budgetCtrl";

        public budget: BudgetItem;

        constructor(private $scope: ng.IScope, $stateParams, private $location: ng.ILocationService, private modelService: ModelService) {
            this.budget = modelService.getBudgetItem($stateParams.itemid);

            var scopeInject = <any>$scope;
            scopeInject.budget = this.budget;

            console.log("BudgetCtrl created with " + this.budget.subject + " containing " + this.budget.subitems.length + " items.");
        }
    }
}