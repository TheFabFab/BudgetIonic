module Budget {
    "use strict";

    export class NewAccountCtrl {
        public static IID = "newAccountCtrl";
        public static controllerAs = NewAccountCtrl.IID + " as vm";

        public static $inject = [
            "$stateParams",
            "$state",
            "$scope",
            "$log",
            DataService.IID,
            "projectData"
        ];

        public subject = "";
        public description = "";
        public parentId: string;

        constructor(
            $stateParams,
            private $state: ng.ui.IStateService,
            $scope: ng.IScope,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private projectData: DataWithKey<ProjectHeader>) {

            $log.debug("Initializing new account controller", $stateParams);
            this.parentId = $stateParams.parentId || "root";
        }

        public ok(): void {
            this.dataService.addChildAccount(this.projectData.key, this.parentId, this.subject, this.description)
                .then(x => this.close());
        }

        public cancel(): void {
            this.close();
        }

        private close(): void {
            this.$log.debug("Closing");
            this.$state.go(
                "app.logged-in.project.account",
                <IAccountStateParams>{ projectId: this.projectData.key, accountId: this.parentId });
        }
    }
}