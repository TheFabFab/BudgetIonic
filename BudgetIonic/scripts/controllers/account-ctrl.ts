/// <reference path="../services/command-service.ts" />
 /// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountStateParams {
        accountId: string;
    }

    class TransactionViewModel {
        constructor(public label: string, public timestamp: number) {
        }
    }

    export class AccountCtrl {
        public static IID = "accountCtrl";
        public static controllerAs = AccountCtrl.IID + " as vm";

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
        private addExpenseCommand: Command;

        public accountData: IAccountData;
        public subAccounts: AngularFireArray;
        public transactions: TransactionViewModel[] = [];

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
            private $scope: ng.IScope,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private commandService: CommandService,
            private accountSnapshot: FirebaseDataSnapshot) {

            $log.debug("Initializing account controller", arguments);

            this.accountData = accountSnapshot.exportVal<IAccountData>();

            this.addSubaccountCommand = new Command("Add subaccount to " + this.accountData.subject, "/#/budget/new/" + this.accountSnapshot.key());
            this.deleteCommand = new Command("Delete account", "/#/budget/delete/" + this.accountSnapshot.key(), false);
            this.allocateBudgetCommand = new Command("Allocate budget", "/#/budget/allocate/" + this.accountSnapshot.key());
            this.addExpenseCommand = new Command("Register expense", "/#/budget/expense/" + this.accountSnapshot.key());

            $firebaseObject(accountSnapshot.ref()).$bindTo($scope, "accountData");

            var accounts = dataService.getAccountsReference();

            var childrenQuery =
                accounts
                .orderByChild("parent")
                .equalTo(accountSnapshot.key());

            this.subAccounts = $firebaseArray(childrenQuery);

            this.subAccounts.$watch(event => $log.debug("subAccounts.watch", event, this.subAccounts));

            var transactions = dataService.getTransactionsReference();

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
            this.$scope.$digest();
        }

        private updateContextCommands(): void {
            var hasData =
                this.subAccounts.length == 0 &&
                this.transactions.length == 0;

            if (this.deleteCommand != null) {
                this.deleteCommand.isEnabled = hasData;
            }
        }

        public setContextCommands(): void {
            this.commandService.registerContextCommands([
                this.allocateBudgetCommand,
                this.addExpenseCommand,
                this.addSubaccountCommand,
                this.deleteCommand,
            ]);
        }
    }
}