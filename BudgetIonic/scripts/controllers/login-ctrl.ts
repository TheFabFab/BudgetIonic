module Budget {
    export interface ILoginParams {
        toState: string,
        toParams: Object,
    }

    export class LoginCtrl {
        public static IID = "loginCtrl";
        public static controllerAs = LoginCtrl.IID + " as vm";

        public static $inject = [
            "$stateParams",
            "$state",
            "$scope",
            "$log",
            DataService.IID,
        ];

        constructor(
            private $stateParams: ILoginParams,
            private $state: ng.ui.IStateService,
            $scope: ng.IScope,
            $log: ng.ILogService,
            private dataService: IDataService) {

            $log.debug("Initializing login controller", $stateParams);
        }

        public facebook() {
            this.dataService.facebookLogin()
                .then(authData => {
                    this.$state.go(this.$stateParams.toState, this.$stateParams.toParams);
                });
        }
    }
}