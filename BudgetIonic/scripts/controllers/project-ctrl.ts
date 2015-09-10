/// <reference path="../services/data-service.ts" />
module Budget {
    export class ProjectCtrl {
        public static IID = "projectCtrl";
        public static controllerAs = ProjectCtrl.IID + " as vm";

        public static resolve() {
            return {
                projectData: [
                    "$stateParams", "$log", DataService.IID, ($stateParams, $log: ng.ILogService, dataService: IDataService) => {
                        var projectHeader = dataService.getProjectHeader($stateParams.projectId);
                        projectHeader.then(ph => $log.debug("ProjectCtrl resolved project from stateParams", $stateParams, ph));
                        return projectHeader;
                    }
                ]};
        }

        public static $inject = [
            "$scope",
            "$log",
            DataService.IID,
            "projectData"
        ];

        public rootAccount: AccountData;

        constructor($scope: ng.IScope, $log: ng.ILogService, private dataService: DataService, public projectData: DataWithKey<ProjectHeader>) {
            $log.debug("Initializing project controller", projectData);

            var rootAccountKey = projectData.data.rootAccount;
            this.dataService.getAccountSnapshot(projectData.key, rootAccountKey)
                .then(rootAccountSnapshot => {
                    if (rootAccountSnapshot !== null) {
                        this.rootAccount = AccountData.fromSnapshot(rootAccountSnapshot);
                    }
                });
        }
    }
}