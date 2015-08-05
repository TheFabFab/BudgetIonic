/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var MainCtrl = (function () {
        function MainCtrl($scope, $firebaseObject, $log, dataService, rootAccountReference) {
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$log = $log;
            this.dataService = dataService;
            this.rootAccountReference = rootAccountReference;
            console.log("Initializing main controller");
            $firebaseObject(rootAccountReference).$bindTo($scope, "rootAccount");
        }
        MainCtrl.resolve = function () {
            return {
                rootAccountReference: [Budget.DataService.IID, MainCtrl.getAccount],
            };
        };
        MainCtrl.getAccount = function (dataService) {
            return dataService.getRootAccountReference();
        };
        MainCtrl.$inject = [
            '$scope',
            "$firebaseObject",
            "$log",
            Budget.DataService.IID,
            'rootAccountReference',
        ];
        MainCtrl.IID = "mainCtrl";
        return MainCtrl;
    })();
    Budget.MainCtrl = MainCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=main-ctrl.js.map