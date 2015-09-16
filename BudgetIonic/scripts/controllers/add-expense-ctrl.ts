module Budget {
    "use strict";

    export class AddExpenseCtrl {

        public static IID: string = "addExpenseCtrl";
        public static controllerAs = AddExpenseCtrl.IID + " as vm";

        public debitAccount: AccountData;
        public amount = 0;
        public isEnabled = false;

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
            "projectData",
            "userData"
        ];

        constructor(
            $stateParams,
            private $scope: ng.IScope,
            private $state: angular.ui.IStateService,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private $ionicHistory,
            private $q: ng.IQService,
            private dataService: IDataService,
            private projectData: DataWithKey<ProjectHeader>,
            private userData: UserData) {

            $log.debug("Initializing add expense controller", arguments);

            const debitAccountId = $stateParams.accountId || "root";
            this.dataService.getAccountSnapshot(projectData.key, debitAccountId)
                .then(snapshot => {
                    this.debitAccount = AccountData.fromSnapshot(snapshot);
                    this.validate();
                });
            const us1 = this.$scope.$watch(() => this.amount, _ => this.validate());
        }

        public ok(): void {

            this.dataService.addTransaction(
            this.projectData.key,
            {
                amount: this.amount,
                credit: "",
                creditAccountName: "Expenses",
                debit: this.debitAccount.key,
                debitAccountName: this.debitAccount.subject,
                timestamp: Firebase.ServerValue.TIMESTAMP,
                userId: this.userData.uid
            }).then(x => this.close());
        }

        public cancel(): void {
            this.close();
        }

        private close(): void {
            this.$state.go(
                "app.logged-in.project.account",
                <IAccountStateParams>{ accountId: this.debitAccount.key });
        }

        private validate(): void {
            let result = false;
            if (this.debitAccount.credited - this.debitAccount.debited >= this.amount) {
                result = true;
            }

            this.isEnabled = result;
        }
    }
}