/// <reference path="../services/model-service.ts" />

module Budget {
    'use strict';

    export class BudgetItemCtrl {
        public static $inject = [
            '$scope',
            "$stateParams",
            '$location',
            ModelService.IID
        ];

        public static IID = "budgetItemCtrl";

        public budgetItem: BudgetItem;

        constructor(private $scope: ng.IScope, $stateParams, private $location: ng.ILocationService, private modelService: ModelService) {
            console.log($stateParams);
            this.budgetItem =
                $stateParams.itemid === undefined
                ? modelService.getBudget()
                : modelService.getBudgetItem($stateParams.itemid);

            var scopeInject = <any>$scope;
            scopeInject.budgetItem = this.budgetItem;

            console.log("BudgetCtrl created with " + this.budgetItem.subject + " containing " + this.budgetItem.subitems.length + " items.");
        }
    }
}