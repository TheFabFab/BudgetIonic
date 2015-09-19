module Budget {
    "use strict";

    export class DeleteAccountCtrl {
        public static IID = "deleteAccountCtrl";
        public static controllerAs = DeleteAccountCtrl.IID + " as vm";

        public static $inject = [
            "$state",
            "$ionicHistory",
            "$log",
            DataService.IID,
            "projectData",
            "accountSnapshot"
        ];

        private accountId: string;
        public account: AccountData;

        constructor(
            private $state: ng.ui.IStateService,
            private $ionicHistory,
            $log: ng.ILogService,
            private dataService: IDataService,
            private projectData: DataWithKey<ProjectHeader>,
            private accountSnapshot: FirebaseDataSnapshot) {

            $log.debug("Initializing delete account controller");
            this.account = AccountData.fromSnapshot(accountSnapshot);
        }

        public ok(): void {
            this.dataService.deleteAccount(this.projectData.key, this.accountId)
                .then(x => this.$state.go("app.logged-in.project.account", <IAccountStateParams>{ accountId: this.account.parent }));
        }

        public cancel(): void {
            this.$state.go("app.logged-in.project.account", <IAccountStateParams>{ accountId: this.accountId });
        }
    }
}