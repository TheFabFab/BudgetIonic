module Budget {
    export class ProjectCtrl {
        public static IID = "projectCtrl";
        public static controllerAs = ProjectCtrl.IID + " as projectVm";

        public static resolve() {
            return {
                projectData: [
                    "$stateParams", "$log", DataService.IID, ($stateParams, $log: ng.ILogService, dataService: IDataService) => {
                        var projectHeader = dataService.getProjectHeader($stateParams.projectId);
                        $log.debug("ProjectCtrl resolving project from stateParams", $stateParams);
                        return projectHeader;
                    }
                ]};
        }

        public static $inject = [
            "$log",
            "projectData"
        ];

        constructor($log: ng.ILogService, private projectData: DataWithKey<ProjectHeader>) {
            $log.debug("Initializing project controller", projectData);
        }
    }
}