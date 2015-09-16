module Budget {
    export class ProjectsCtrl {
        public static IID = "projectsCtrl";
        public static controllerAs = ProjectsCtrl.IID + " as vm";

        public projects: ProjectOfUser[] = [];
        public newProjectTitle = "";

        public static $inject = [
            "$log",
            DataService.IID,
            "userData"
        ];

        constructor(private $log: ng.ILogService, private dataService: IDataService, private userData: UserData) {
            $log.debug("Initializing projects controller.");

            dataService.getProjectsForUser(userData.uid)
                .then(projects => this.projects = projects);
        }

        public onAddNew() {
            console.assert(this.newProjectTitle.length > 0);

            this.dataService.addNewProject(this.userData.uid, this.newProjectTitle)
                .then(x => this.projects.unshift(x));

            this.newProjectTitle = "";
        }
    }
}