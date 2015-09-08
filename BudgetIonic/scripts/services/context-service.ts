module Budget {
    export class ContextService {
        public static IID = "contextService";

        public static $inject = [
            "$log"
        ];

        private projectHeader: DataWithKey<ProjectHeader>;

        constructor($log: ng.ILogService) {
            $log.debug("Initializing context service");
        }

        public setCurrentProject(projectHeader: DataWithKey<ProjectHeader>) {
            this.projectHeader = projectHeader;
        }

        public getProjectHeader(): DataWithKey<ProjectHeader> {
            return this.projectHeader;
        }
    }
}