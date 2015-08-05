/// <reference path="../services/model-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var SideMenuCtrl = (function () {
        function SideMenuCtrl($scope, $location, modelService) {
            this.$scope = $scope;
            this.$location = $location;
            this.modelService = modelService;
            console.log("SideMenuCtrl created");
            this.budget = modelService.getBudget();
            $scope.budget = this.budget;
        }
        SideMenuCtrl.$inject = [
            '$scope',
            '$location',
            Budget.ModelService.IID
        ];
        SideMenuCtrl.IID = "sideMenuCtrl";
        return SideMenuCtrl;
    })();
    Budget.SideMenuCtrl = SideMenuCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=sidemenuctrl.js.map