/// <reference path="../services/command-service.ts" />
/// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var AccountCtrl = (function () {
        function AccountCtrl($rootScope, $scope, $firebaseObject, $firebaseArray, $log, dataService, commandService, accountReference) {
            var _this = this;
            this.$rootScope = $rootScope;
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.dataService = dataService;
            this.commandService = commandService;
            this.accountReference = accountReference;
            $log.debug("Initializing account controller", arguments);
            $firebaseObject(accountReference).$bindTo($scope, "accountData")
                .then(function (x) { return _this.activate(); });
            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");
            var childrenQuery = accounts
                .orderByChild("parent")
                .equalTo(accountReference.key());
            $scope.subAccounts = $firebaseArray(childrenQuery);
            var transactions = new Firebase("https://budgetionic.firebaseio.com/transactions");
            var creditTransactionQuery = transactions
                .orderByChild("credit")
                .equalTo(accountReference.key());
            $scope.creditTransactions = $firebaseArray(creditTransactionQuery);
            var debitTransactionQuery = transactions
                .orderByChild("debit")
                .equalTo(accountReference.key());
            $scope.debitTransactions = $firebaseArray(debitTransactionQuery);
            $rootScope.$on('$viewContentLoaded', function (event, viewConfig) {
                $log.debug("$viewContentLoaded", event, viewConfig);
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
        AccountCtrl.prototype.activate = function () {
            this.commandService.registerContextCommands([
                new Budget.Command("Add subaccount to " + this.$scope.accountData.subject, "/#/budget/new/" + this.accountReference.key())
            ]);
        };
        AccountCtrl.IID = "accountCtrl";
        AccountCtrl.$inject = [
            '$rootScope',
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            Budget.DataService.IID,
            Budget.CommandService.IID,
            "accountReference",
        ];
        return AccountCtrl;
    })();
    Budget.AccountCtrl = AccountCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=account-ctrl.js.map