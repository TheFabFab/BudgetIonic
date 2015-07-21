/// <reference path="../services/model-service.ts" />

module Budget {
    'use strict';

    export class MainCtrl {
        public static $inject = [
            '$scope',
            '$location',
            ModelService.IID
        ];

        public static IID = "mainCtrl";
        public budget: BudgetItem;

        constructor(private $scope, private $location: ng.ILocationService, private modelService: ModelService) {
            console.log("MainCtrl created");
            this.budget = modelService.getBudget();
            $scope.budget = this.budget;
        }
    }
}