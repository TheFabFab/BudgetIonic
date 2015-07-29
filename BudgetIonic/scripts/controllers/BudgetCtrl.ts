/// <reference path="../services/model-service.ts" />
/// <reference path="../services/data-service.ts" />

module Budget {
    'use strict';

    export class BudgetItemCtrl {
        public static $inject = [
            '$scope',
            "$stateParams",
            '$location',
            ModelService.IID,
            DataService.IID
        ];

        public static IID = "budgetItemCtrl";

        public budgetItem: BudgetItem;

        constructor(
            private $scope: ng.IScope,
            private $stateParams,
            private $location: ng.ILocationService,
            private modelService: ModelService,
            private dataService: DataService) {

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