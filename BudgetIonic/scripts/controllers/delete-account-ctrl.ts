﻿module Budget {
    "use strict";

    export class DeleteAccountCtrl {
        public static IID = "deleteAccountCtrl";
        public static controllerAs = DeleteAccountCtrl.IID + " as vm";

        public static $inject = [
            "$stateParams",
            "$state",
            "$ionicHistory",
            "$log",
            DataService.IID,
            "projectData"
        ];

        private accountId: string;
        public account: IAccountData;

        constructor(
            $stateParams,
            private $state: ng.ui.IStateService,
            private $ionicHistory,
            $log: ng.ILogService,
            private dataService: IDataService,
            private projectData: DataWithKey<ProjectHeader>) {

            $log.debug("Initializing delete account controller", $stateParams);
            this.accountId = $stateParams.accountId || "root";

            this.dataService.getAccountSnapshot(this.projectData.key, this.accountId)
                .then(snapshot => {
                    this.account = <IAccountData>snapshot.exportVal();
                });
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