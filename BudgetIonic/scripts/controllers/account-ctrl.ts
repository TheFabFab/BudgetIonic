/// <reference path="../services/command-service.ts" />
 /// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountStateParams {
        accountId: string;
    }

    export class TransactionViewModel {
        constructor(public label: string, public timestamp: number) {
        }
    }

    export class AccountCtrl {
        public static IID = "accountCtrl";
        public static controllerAs = AccountCtrl.IID + " as vm";

        public static resolve() {
            return {
                accountSnapshot: ["$stateParams", "projectData", DataService.IID, AccountCtrl.getAccount]
            };
        }

        public static getAccount(
            $stateParams: IAccountStateParams,
            projectData: DataWithKey<ProjectData>,
            dataService: IDataService): ng.IPromise<FirebaseDataSnapshot> {

            console.log("Getting account from state parameters", $stateParams, projectData);

            const accountId = $stateParams.accountId || projectData.data.rootAccount;
            return dataService.getAccountSnapshot(projectData.key, accountId);
        }

        private addSubaccountCommand: Command;
        private deleteCommand: Command;
        private allocateBudgetCommand: Command;
        private addExpenseCommand: Command;

        public accountData: IAccountData;
        public subAccounts: AngularFireArray;
        public transactions: TransactionViewModel[] = [];

        public static $inject = [
            "$scope",
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            DataService.IID,
            CommandService.IID,
            "projectData",
            "accountSnapshot"
        ];

        constructor(
            private $scope: ng.IScope,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private commandService: CommandService,
            private projectData: DataWithKey<ProjectData>,
            private accountSnapshot: FirebaseDataSnapshot) {

            $log.debug("Initializing account controller", arguments);

            this.accountData = accountSnapshot.exportVal<IAccountData>();

            this.addSubaccountCommand = new Command("Add subaccount", "/#/budget/project/" + this.projectData.key + "/new/" + this.accountSnapshot.key());
            this.deleteCommand = new Command("Delete account", "/#/budget/project/" + this.projectData.key + "/delete/" + this.accountSnapshot.key(), false);
            this.allocateBudgetCommand = new Command("Allocate budget", "/#/budget/project/" + this.projectData.key + "/allocate/" + this.accountSnapshot.key());
            this.addExpenseCommand = new Command("Register expense", "/#/budget/project/" + this.projectData.key + "/expense/" + this.accountSnapshot.key());

            $firebaseObject(accountSnapshot.ref()).$bindTo($scope, "accountData");

            var projects = dataService.getProjectsReference();

            var childrenQuery =
                projects
                    .child(projectData.key)
                    .child("accounts")
                    .orderByChild("parent")
                    .equalTo(accountSnapshot.key());

            this.subAccounts = $firebaseArray(childrenQuery);

            this.subAccounts.$watch(event => $log.debug("subAccounts.watch", event, this.subAccounts));

            var transactions =
                projects
                .child(projectData.key)
                .child("accounts");

            var creditTransactionQuery =
                transactions
                    .orderByChild("credit")
                    .equalTo(accountSnapshot.key())
                    .limitToFirst(10);

            var debitTransactionQuery =
                transactions
                    .orderByChild("debit")
                    .equalTo(accountSnapshot.key())
                    .limitToFirst(10);

            creditTransactionQuery.on(FirebaseEvents.child_added, snapShot => {
                var transaction = snapShot.exportVal<ITransactionData>();
                var label = "Credited " + transaction.amount + " from '" + transaction.debitAccountName + "'.";
                var vm = new TransactionViewModel(label, transaction.timestamp);
                this.insertTransaction(vm);
            });

            debitTransactionQuery.on(FirebaseEvents.child_added, snapShot => {
                var transaction = snapShot.exportVal<ITransactionData>();
                var label = "Debited " + transaction.amount + " to '" + transaction.creditAccountName + "'.";
                var vm = new TransactionViewModel(label, transaction.timestamp);
                this.insertTransaction(vm);
            });

            $scope.$on('$ionicView.enter', () => {
                $log.debug("Entering account controller", this.$scope);
                this.updateContextCommands();
                this.setContextCommands();
            });

            this.subAccounts.$watch((event, key, prevChild) => this.updateContextCommands());
            $scope.$watch(x => this.transactions, () => this.updateContextCommands());
        }

        private insertTransaction(transactionVm: TransactionViewModel): void {
            var index = 0;
            this.transactions.forEach(x => {
                if (x.timestamp > transactionVm.timestamp) index++;
            });
            this.transactions.splice(index, 0, transactionVm);
        }

        private updateContextCommands(): void {
            const hasData = this.subAccounts.length === 0 &&
                this.transactions.length === 0;
            if (this.deleteCommand != null) {
                this.deleteCommand.isEnabled = hasData;
            }
        }

        public setContextCommands(): void {
            this.commandService.registerContextCommands([
                this.allocateBudgetCommand,
                this.addExpenseCommand,
                this.addSubaccountCommand,
                this.deleteCommand
            ]);
        }
    }
}