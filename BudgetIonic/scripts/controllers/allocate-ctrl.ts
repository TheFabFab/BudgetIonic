module Budget {
    "use strict";

    export class HelperCommand {
        constructor(
            public label: string,
            public action: () => void) {
        }
    }

    export class AllocateBudgetCtrl {

        public static IID: string = "allocateBudgetCtrl";
        public static controllerAs = AllocateBudgetCtrl.IID + " as vm";

        private creditAccountId: string;

        public creditAccount: IAccountData;
        public debitAccount: AccountData;
        public amount: number = 0;
        public ancestors: AccountData[];
        public isEnabled = false;
        public helperCommands: HelperCommand[] = [];

        public static $inject = [
            "$stateParams",
            "$scope",
            "$state",
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            "$ionicHistory",
            "$q",
            DataService.IID,
            "projectData"
        ];

        constructor(
            $stateParams,
            private $scope: ng.IScope,
            private $state: ng.ui.IStateService,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private $ionicHistory,
            private $q: ng.IQService,
            private dataService: IDataService,
            private projectData: DataWithKey<ProjectHeader>) {

            $log.debug("Initializing allocate controller", arguments);

            this.creditAccountId = $stateParams.accountId || "root";

            this.dataService.getAccountSnapshot(this.projectData.key, this.creditAccountId)
                .then(snapshot => {
                    this.creditAccount = snapshot.exportVal<IAccountData>();
                })
                .then(x => {
                    if (this.creditAccount.parent !== "") {
                        this.getAncestors()
                            .then(ancestors => {
                                console.assert(ancestors.length > 0);
                                this.ancestors = ancestors;
                                this.debitAccount = ancestors[0];
                            });
                    }
                })
                .then(_ => this.validate());

            var us1 = this.$scope.$watch(() => this.amount, _ => this.validate());
            var us2 = this.$scope.$watch(() => this.debitAccount, _ => this.validate());
        }

        public ok(): void {
            if (this.creditAccount != null && this.creditAccount.parent === "") {
                this.dataService.addTransaction(
                    this.projectData.key,
                    {
                        amount: this.amount,
                        debit: "",
                        debitAccountName: "",
                        credit: this.creditAccountId,
                        creditAccountName: this.creditAccount.subject,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }).then(x => {
                    this.close();
                });
            } else {
                var promises: ng.IPromise<any>[] = [];

                // Bubble up the amount to the requested account
                var previousAccount = null;

                // make a copy
                var accounts = this.ancestors.slice(0);

                // add the credit account itself
                accounts.push(AccountData.fromIAccountData(this.creditAccount, this.creditAccountId));

                // remove up to (including) the debit account
                while (previousAccount == null || previousAccount.key != this.debitAccount.key) {
                    previousAccount = accounts.shift();
                }

                // do the credit bubbling
                accounts.forEach(account => {
                    var debitAccount = previousAccount;
                    var creditAccount = account;

                    var promise =
                        this.dataService.addTransaction(
                            this.projectData.key,
                            {
                                amount: this.amount,
                                debit: debitAccount.key,
                                debitAccountName: debitAccount.subject,
                                credit: creditAccount.key,
                                creditAccountName: creditAccount.subject,
                                timestamp: Firebase.ServerValue.TIMESTAMP
                            });

                    promises.push(promise);

                    previousAccount = account;
                });

                // wait for all to get saved, then return
                this.$q.all(promises)
                    .then(x => this.close());
            }
        }

        public cancel(): void {
            this.close();
        }

        private close(): void {
            this.$state.go(
                "logged-in.project.budget-account",
                <IAccountStateParams>{ accountId: this.creditAccountId });
        }

        private validate(): void {
            let result = false;
            this.helperCommands = [];

            if (this.creditAccount != null && this.creditAccount.parent === "") {
                if (this.amount > 0) result = true;
            } else if (this.creditAccount != null &&
                this.debitAccount != null &&
                this.amount > 0) {

                var debitAccountBalance = this.debitAccount.credited - this.debitAccount.debited;
                if (debitAccountBalance < this.amount) {
                    this.helperCommands.push(
                        new HelperCommand(
                            "The balance  on '" + this.debitAccount.subject + "' is " + debitAccountBalance + ". Tap to adjust the amount.",
                            () => this.amount = debitAccountBalance));
                    this.helperCommands.push(
                        new HelperCommand(
                            "Or you could get the amount from free balances",
                            null));
                } else {
                    result = true;
                }
            }

            this.isEnabled = result;
        }

        private getAncestors(account: IAccountData = null): ng.IPromise<AccountData[]> {
            if (!account) account = this.creditAccount;

            var deferred = this.$q.defer<AccountData[]>();

            if (account.parent) {
                this.dataService.getAccountSnapshot(this.projectData.key, account.parent)
                    .then(parentSnapshot => {
                        if (parentSnapshot) {
                            var parent = AccountData.fromSnapshot(parentSnapshot);
                            this.$log.debug("Ancestor:", parent);
                                this.getAncestors(parent)
                                    .then(parentAncestors => {
                                        parentAncestors.push(parent);
                                        deferred.resolve(parentAncestors);
                                });
                        } else {
                            deferred.resolve([]);
                        }
                    });
            } else {
                deferred.resolve([]);
            }

            return deferred.promise;
        }
    }
}