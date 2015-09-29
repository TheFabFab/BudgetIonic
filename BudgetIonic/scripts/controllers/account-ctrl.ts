/// <reference path="../services/command-service.ts" />
 /// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    "use strict";

    export interface IAccountStateParams {
        accountId: string;
    }

    export class TransactionViewModel {
        public profilePicture: Object;
        constructor(public userId: string, public label: string, public timestamp: number) {
        }
    }

    export class AccountCtrl {
        public static IID = "accountCtrl";
        public static controllerAs = AccountCtrl.IID + " as vm";

        public static resolveAccountSnapshot() {
            return {
                accountSnapshot: ["$stateParams", "projectData", DataService.IID, AccountCtrl.getAccount]
            };
        }

        public static resolveHome() {
            return {
                redirect: ["$q", DataService.IID, "projectData", ($q: ng.IQService, dataService: IDataService, projectData: DataWithKey<ProjectHeader>) => {
                    var rootAccountId = projectData.data.rootAccount;
                    var deferred = $q.defer();
                    deferred.reject({
                        reason: "redirect",
                        state: "app.logged-in.project.account",
                        params: { projectId: projectData.key, accountId: rootAccountId }
                    });
                    return deferred.promise;
                }]
            };
        }

        public static getAccount(
            $stateParams: IAccountStateParams,
            projectData: DataWithKey<ProjectHeader>,
            dataService: IDataService): ng.IPromise<FirebaseDataSnapshot> {

            console.log("Getting account from state parameters", $stateParams, projectData);

            const accountId = $stateParams.accountId || projectData.data.rootAccount;
            return dataService.getAccountSnapshot(projectData.key, accountId);
        }

        private addSubaccountCommand: Command;
        private deleteCommand: Command;
        private allocateBudgetCommand: Command;
        private addExpenseCommand: Command;

        public accountData: AccountData;
        public subAccounts: AngularFireArray;
        public transactions: TransactionViewModel[] = [];

        public static $inject = [
            "$timeout",
            "$scope",
            "$state",
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            DataService.IID,
            CommandService.IID,
            "projectData",
            "accountSnapshot"
        ];

        constructor(
            private $timeout: ng.ITimeoutService,
            private $scope: ng.IScope,
            private $state: ng.ui.IStateService,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private commandService: CommandService,
            private projectData: DataWithKey<ProjectHeader>,
            private accountSnapshot: FirebaseDataSnapshot) {

            $log.debug("Initializing account controller");

            this.accountData = AccountData.fromSnapshot(accountSnapshot);

            $timeout(() => {
                accountSnapshot.ref()
                    .on(FirebaseEvents.value, accountSnapshot => {
                        this.accountData = AccountData.fromSnapshot(accountSnapshot);
                    });

                this.allocateBudgetCommand = new Command($state, "Allocate budget", "app.logged-in.project.allocate", { projectId: this.projectData.key, accountId: this.accountSnapshot.key() });
                this.addExpenseCommand = new Command($state, "Register expense", "app.logged-in.project.expense", { projectId: this.projectData.key, accountId: this.accountSnapshot.key() });
                this.addSubaccountCommand = new Command($state, "Add subaccount", "app.logged-in.project.new", { projectId: this.projectData.key, accountId: this.accountSnapshot.key() });
                this.deleteCommand = new Command($state, "Delete account", "app.logged-in.project.delete-account", { projectId: this.projectData.key, accountId: this.accountSnapshot.key() }, false);

                const projects = dataService.getProjectsReference();
                const childrenQuery = projects
                    .child(projectData.key)
                    .child("accounts")
                    .orderByChild("parent")
                    .equalTo(accountSnapshot.key());
                this.subAccounts = $firebaseArray(childrenQuery);

                this.subAccounts.$watch(event => $log.debug("subAccounts.watch", event, this.subAccounts));
                const transactions = projects
                    .child(projectData.key)
                    .child("transactions");

                const creditTransactionQuery = transactions
                    .orderByChild("credit")
                    .equalTo(accountSnapshot.key())
                    .limitToFirst(10);
                const debitTransactionQuery = transactions
                    .orderByChild("debit")
                    .equalTo(accountSnapshot.key())
                    .limitToFirst(10);

                creditTransactionQuery.on(FirebaseEvents.child_added, snapShot => {
                    var transaction = snapShot.exportVal<ITransactionData>();
                    var label = `Credited ${transaction.amount} from '${transaction.debitAccountName}'.`;
                    var vm = new TransactionViewModel(transaction.userId, label, transaction.timestamp);
                    this.insertTransaction(vm);
                });

                debitTransactionQuery.on(FirebaseEvents.child_added, snapShot => {
                    var transaction = snapShot.exportVal<ITransactionData>();
                    var label = `Debited ${transaction.amount} to '${transaction.creditAccountName}'.`;
                    var vm = new TransactionViewModel(transaction.userId, label, transaction.timestamp);
                    this.insertTransaction(vm);
                });

                $scope.$on("$ionicView.beforeLeave", () => {
                    $log.debug("Leaving account controller", this.$scope);
                    this.commandService.registerContextCommands([]);
                });

                $scope.$on("$ionicView.afterEnter", () => {
                    $log.debug("Entering account controller", this.$scope);
                    this.updateContextCommands();
                    this.setContextCommands();
                });

                this.subAccounts.$watch(() => this.updateContextCommands());
                $scope.$watch(x => this.transactions, () => this.updateContextCommands());
            }, 0);
        }

        private insertTransaction(transactionVm: TransactionViewModel): void {
            if (transactionVm.userId) {
                this.dataService
                    .getUserPicture(transactionVm.userId)
                    .then(picture => {
                        transactionVm.profilePicture = {
                            "background-image": `url('${picture}')`
                        };
                    });
            }

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