module Budget {
    'use strict';

    export class AllocateBudgetCtrl {

        public static IID: string = "allocateBudgetCtrl";

        private creditAccountId: string;

        public creditAccount: IAccountData;
        public debitAccount: AccountData;
        public amount: number = 0;
        public ancestors: AccountData[];

        public static $inject = [
            '$stateParams',
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            "$ionicHistory",
            "$q",
            DataService.IID,
        ];

        constructor(
            $stateParams,
            private $scope: ng.IScope,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private $ionicHistory,
            private $q: ng.IQService,
            private dataService: IDataService) {

            $log.debug("Initializing allocate controller", arguments);

            this.creditAccountId = $stateParams.accountId || 'root';

            this.dataService.getAccountSnapshot(this.creditAccountId)
                .then(snapshot => {
                    this.creditAccount = snapshot.exportVal<IAccountData>();
                })
                .then(x => {
                    this.getAncestors().then(ancestors => this.ancestors = ancestors);
                });
        }

        public ok(): void {
            if (this.debitAccount) {
                var promises: ng.IPromise<any>[] = [];

                var balance = this.debitAccount.credited - this.debitAccount.debited;
                if (this.amount < this.amount) {
                    /// TODO: Error handling
                    if (this.debitAccount.parent == null) {
                    } else {
                    }
                } else {
                    // Bubble up the amount to the requested account
                    var previousAccount = null;

                    // make a copy
                    var accounts = this.ancestors.slice(0);

                    // add the credit account itself
                    accounts.push(AccountData.copy(this.creditAccount, this.creditAccountId));

                    // remove up to (including) the debit account
                    while (previousAccount == null || previousAccount.key != this.debitAccount.key) {
                        previousAccount = accounts.shift();
                    }

                    // do the credit bubbling
                    accounts.forEach(account => {
                        var debitAccount = previousAccount;
                        var creditAccount = account;

                        var promise =
                            this.dataService.addTransaction({
                                amount: this.amount,
                                debit: debitAccount.key,
                                credit: creditAccount.key,
                                timestamp: Firebase.ServerValue.TIMESTAMP
                            });

                        promises.push(promise);

                        previousAccount = account;
                    });

                    // wait for all to get saved, then return
                    this.$q.all(promises)
                        .then(x => this.$ionicHistory.goBack());
                }
            }
        }

        public cancel(): void {
            this.$ionicHistory.goBack();
        }

        private getAncestors(account: IAccountData = null): ng.IPromise<AccountData[]> {
            if (!account) account = this.creditAccount;

            var deferred = this.$q.defer<AccountData[]>();

            if (account.parent) {
                this.dataService.getAccountSnapshot(account.parent)
                    .then(parentSnapshot => {
                        if (parentSnapshot) {
                            var parent = AccountData.copy(parentSnapshot.exportVal<IAccountData>(), parentSnapshot.key());
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