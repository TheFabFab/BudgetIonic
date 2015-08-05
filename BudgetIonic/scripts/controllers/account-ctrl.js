/// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var AccountCtrl = (function () {
        function AccountCtrl($scope, $firebaseObject, $firebaseArray, $log, dataService, accountReference) {
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.dataService = dataService;
            this.accountReference = accountReference;
            $log.debug("Initializing account controller", arguments);
            $firebaseObject(accountReference).$bindTo($scope, "accountData");
            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");
            var childrenQuery = accounts
                .orderByChild("parent")
                .equalTo(accountReference.key());
            console.log(accountReference.key());
            $scope.subAccounts = $firebaseArray(childrenQuery);
            $scope.subAccounts.$loaded(function (x) {
                console.log($scope.subAccounts);
            });
        }
        AccountCtrl.resolve = function () {
            return {
                accountReference: ['$stateParams', Budget.DataService.IID, AccountCtrl.getAccount],
            };
        };
        AccountCtrl.getAccount = function ($stateParams, dataService) {
            console.log("Getting account: ");
            console.log($stateParams);
            var accountId = $stateParams.accountId || '';
            return dataService.getAccountReference(accountId);
        };
        AccountCtrl.IID = "accountCtrl";
        AccountCtrl.$inject = [
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            Budget.DataService.IID,
            "accountReference",
        ];
        return AccountCtrl;
    })();
    Budget.AccountCtrl = AccountCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=account-ctrl.js.map