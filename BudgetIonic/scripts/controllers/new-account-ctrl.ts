module Budget {
    "use strict";

    export class NewAccountCtrl {
        public static IID = "newAccountCtrl";
        public static controllerAs = NewAccountCtrl.IID + " as vm";

        public static $inject = [
            "$state",
            "$log",
            DataService.IID,
            "projectData",
            "accountSnapshot"
        ];

        public subject = "";
        public description = "";

        public accountData: AccountData;

        constructor(
            private $state: ng.ui.IStateService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private projectData: DataWithKey<ProjectHeader>,
            private accountSnapshot: FirebaseDataSnapshot) {

            $log.debug("Initializing new account controller");
            this.accountData = AccountData.fromSnapshot(accountSnapshot);
        }

        public ok(): void {
            this.dataService.addChildAccount(this.projectData.key, this.accountSnapshot.key(), this.subject, this.description)
                .then(x => this.close());
        }

        public cancel(): void {
            this.close();
        }

        private close(): void {
            this.$log.debug("Closing");
            this.$state.go(
                "app.logged-in.project.account",
                <IAccountStateParams>{ projectId: this.projectData.key, accountId: this.accountSnapshot.key() });
        }
    }
}