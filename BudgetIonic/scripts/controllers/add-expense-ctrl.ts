module Budget {
    "use strict";

    export class AddExpenseCtrl {

        public static IID: string = "addExpenseCtrl";

        public debitAccount: AccountData;
        public amount: number = 0;
        public isEnabled = false;

        public static $inject = [
            '$stateParams',
            '$scope',
            '$state',
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
            private $state: ng.ui.IStateService,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private $ionicHistory,
            private $q: ng.IQService,
            private dataService: IDataService) {

            $log.debug("Initializing add expense controller", arguments);

            var debitAccountId = $stateParams.accountId || "root";

            this.dataService.getAccountSnapshot(debitAccountId)
                .then(snapshot => {
                    this.debitAccount = AccountData.copy(snapshot.exportVal<IAccountData>(), snapshot.key());
                    this.validate();
                });

            var us1 = this.$scope.$watch(() => this.amount, _ => this.validate());
        }

        public ok(): void {

            this.dataService.addTransaction({
                amount: this.amount,
                credit: "",
                creditAccountName: "",
                debit: this.debitAccount.key,
                debitAccountName: this.debitAccount.subject,
                timestamp: Firebase.ServerValue.TIMESTAMP
            }).then(x => this.close());
        }

        public cancel(): void {
            this.close();
        }

        private close(): void {
            this.$state.go(
                "app.budget-account",
                <IAccountStateParams>{ accountId: this.debitAccount.key });
        }

        private validate(): void {
            var result = false;

            if (this.debitAccount.credited - this.debitAccount.debited >= this.amount) {
                result = true;
            }

            this.isEnabled = result;
        }
    }
}