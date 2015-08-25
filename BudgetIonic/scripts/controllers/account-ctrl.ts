/// <reference path="../services/command-service.ts" />
 /// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountScope extends ng.IScope {
        accountData: IAccountData;
        subAccounts: AngularFireArray;
        creditTransactions: AngularFireArray;
        debitTransactions: AngularFireArray;
        addSubAccount: () => void;
    }

    export interface IAccountStateParams {
        accountId: string;
    }

    export class AccountCtrl {
        public static IID = "accountCtrl";

        public static resolve() {
            return {
                accountSnapshot: ['$stateParams', DataService.IID, AccountCtrl.getAccount],
            };
        }

        public static getAccount(
            $stateParams: IAccountStateParams,
            dataService: IDataService): ng.IPromise<FirebaseDataSnapshot> {
            console.log("Getting account: ");
            console.log($stateParams);
            var accountId = $stateParams.accountId || '';

            return dataService.getAccountSnapshot(accountId);
        }

        private addSubaccountCommand: Command;
        private deleteCommand: Command;
        private allocateBudgetCommand: Command;

        public static $inject = [
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            DataService.IID,
            CommandService.IID,
            "accountSnapshot",
        ];

        constructor(
            private $scope: IAccountScope,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private commandService: CommandService,
            private accountSnapshot: FirebaseDataSnapshot) {

            $log.debug("Initializing account controller", arguments);

            var accountData: IAccountData = accountSnapshot.exportVal<IAccountData>();

            this.addSubaccountCommand = new Command("Add subaccount to " + accountData.subject, "/#/budget/new/" + this.accountSnapshot.key());
            this.deleteCommand = new Command("Delete account", "/#/budget/delete/" + this.accountSnapshot.key(), false);
            this.allocateBudgetCommand = new Command("Allocate budget", "/#/budget/allocate/" + this.accountSnapshot.key());

            $firebaseObject(accountSnapshot.ref()).$bindTo($scope, "accountData");

            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");

            var childrenQuery =
                accounts
                .orderByChild("parent")
                .equalTo(accountSnapshot.key());

            $scope.subAccounts = $firebaseArray(childrenQuery);

            var transactions = new Firebase("https://budgetionic.firebaseio.com/transactions");

            var creditTransactionQuery =
                transactions
                    .orderByChild("credit")
                    .equalTo(accountSnapshot.key());

            $scope.creditTransactions = $firebaseArray(creditTransactionQuery);

            var debitTransactionQuery =
                transactions
                    .orderByChild("debit")
                    .equalTo(accountSnapshot.key());

            $scope.debitTransactions = $firebaseArray(debitTransactionQuery);

            $scope.$on('$ionicView.enter', () => {
                $log.debug("Entering account controller", this.$scope);
                this.updateContextCommands();
                this.setContextCommands();
            });

            $scope.subAccounts.$watch((event, key, prevChild) => this.updateContextCommands());
            $scope.creditTransactions.$watch((event, key, prevChild) => this.updateContextCommands());
            $scope.debitTransactions.$watch((event, key, prevChild) => this.updateContextCommands());
        }

        private updateContextCommands(): void {
            var hasData =
                this.$scope.subAccounts.length == 0 &&
                this.$scope.creditTransactions.length == 0 &&
                this.$scope.debitTransactions.length == 0;

            if (this.deleteCommand != null) {
                this.deleteCommand.isEnabled = hasData;
            }
        }

        public setContextCommands(): void {
            this.commandService.registerContextCommands([
                this.allocateBudgetCommand,
                this.addSubaccountCommand,
                this.deleteCommand,
            ]);
        }
    }
}