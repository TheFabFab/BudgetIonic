/// <reference path="../services/model-service.ts" />

module Budget {
    'use strict';

    export class SideMenuCtrl {
        public static $inject = [
            '$scope',
            '$location',
            ModelService.IID
        ];

        public static IID = "sideMenuCtrl";
        public budget: BudgetItem;

        constructor(private $scope, private $location: ng.ILocationService, private modelService: ModelService) {
            console.log("SideMenuCtrl created");
            this.budget = modelService.getBudget();
            $scope.budget = this.budget;
        }
    }
}