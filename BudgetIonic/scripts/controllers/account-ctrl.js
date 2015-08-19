/// <reference path="../services/command-service.ts" />
/// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var AccountCtrl = (function () {
        function AccountCtrl($scope, $firebaseObject, $firebaseArray, $log, dataService, commandService, accountSnapshot) {
            var _this = this;
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.dataService = dataService;
            this.commandService = commandService;
            this.accountSnapshot = accountSnapshot;
            $log.debug("Initializing account controller", arguments);
            $firebaseObject(accountSnapshot.ref()).$bindTo($scope, "accountData");
            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");
            var childrenQuery = accounts
                .orderByChild("parent")
                .equalTo(accountSnapshot.key());
            $scope.subAccounts = $firebaseArray(childrenQuery);
            var transactions = new Firebase("https://budgetionic.firebaseio.com/transactions");
            var creditTransactionQuery = transactions
                .orderByChild("credit")
                .equalTo(accountSnapshot.key());
            $scope.creditTransactions = $firebaseArray(creditTransactionQuery);
            var debitTransactionQuery = transactions
                .orderByChild("debit")
                .equalTo(accountSnapshot.key());
            $scope.debitTransactions = $firebaseArray(debitTransactionQuery);
            $scope.$on('$ionicView.enter', function () {
                _this.setContextCommands();
            });
        }
        AccountCtrl.resolve = function () {
            return {
                accountSnapshot: ['$stateParams', Budget.DataService.IID, AccountCtrl.getAccount],
            };
        };
        AccountCtrl.getAccount = function ($stateParams, dataService) {
            console.log("Getting account: ");
            console.log($stateParams);
            var accountId = $stateParams.accountId || '';
            return dataService.getAccountSnapshot(accountId);
        };
        AccountCtrl.prototype.setContextCommands = function () {
            this.commandService.registerContextCommands([
                new Budget.Command("Add subaccount to " + this.$scope.accountData.subject, "/#/budget/new/" + this.accountSnapshot.key()),
                new Budget.Command("Delete account", "/#/budget/delete/" + this.accountSnapshot.key()),
            ]);
        };
        AccountCtrl.IID = "accountCtrl";
        AccountCtrl.$inject = [
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            Budget.DataService.IID,
            Budget.CommandService.IID,
            "accountSnapshot",
        ];
        return AccountCtrl;
    })();
    Budget.AccountCtrl = AccountCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=account-ctrl.js.map