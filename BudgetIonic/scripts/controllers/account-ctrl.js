/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var AccountCtrl = (function () {
        function AccountCtrl($scope, $stateParams, $firebaseObject, $log, dataService) {
            this.$scope = $scope;
            this.$stateParams = $stateParams;
            this.$firebaseObject = $firebaseObject;
            this.$log = $log;
            this.dataService = dataService;
            var accountId = $stateParams.accountId || '';
            if (accountId === '') {
                this._account = dataService.getRootAccount();
            }
            else {
                this._account = dataService.getAccount(accountId);
            }
            $firebaseObject(this._account.firebaseObject()).$bindTo($scope, "accountData");
            $scope.account = this._account;
        }
        AccountCtrl.$inject = [
            '$scope',
            "$stateParams",
            "$firebaseObject",
            "$log",
            Budget.DataService.IID
        ];
        AccountCtrl.IID = "accountCtrl";
        return AccountCtrl;
    })();
    Budget.AccountCtrl = AccountCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=account-ctrl.js.map