module Budget {
    export class ProjectCtrl {
        public static IID = "projectCtrl";
        public static controllerAs = ProjectCtrl.IID + " as projectVm";

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
            ContextService.IID,
            "projectData"
        ];

        constructor($scope: ng.IScope, $log: ng.ILogService, private contextService: ContextService, private projectData: DataWithKey<ProjectHeader>) {
            $log.debug("Initializing project controller", projectData);

            $scope.$on("$ionicView.beforeLeave", () => {
                $log.debug("Leaving project controller");
                contextService.setCurrentProject(null);
            });

            $scope.$on("$ionicView.afterEnter", () => {
                $log.debug("Entering project controller");
                contextService.setCurrentProject(projectData);
            });
        }
    }
}