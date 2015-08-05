/// <reference path="../services/model-service.ts" />
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var BudgetItemCtrl = (function () {
        function BudgetItemCtrl($scope, $stateParams, $location, modelService, dataService) {
            this.$scope = $scope;
            this.$stateParams = $stateParams;
            this.$location = $location;
            this.modelService = modelService;
            this.dataService = dataService;
            this.budgetItem =
                $stateParams.itemid === undefined
                    ? modelService.getBudget()
                    : modelService.getBudgetItem($stateParams.itemid);
            var scopeInject = $scope;
            scopeInject.budgetItem = this.budgetItem;
            console.log("BudgetCtrl created with " + this.budgetItem.subject + " containing " + this.budgetItem.subitems.length + " items.");
        }
        BudgetItemCtrl.$inject = [
            '$scope',
            "$stateParams",
            '$location',
            Budget.ModelService.IID,
            Budget.DataService.IID
        ];
        BudgetItemCtrl.IID = "budgetItemCtrl";
        return BudgetItemCtrl;
    })();
    Budget.BudgetItemCtrl = BudgetItemCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=budgetctrl.js.map