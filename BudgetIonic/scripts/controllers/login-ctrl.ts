/// <reference path="../services/authentication-service.ts" />
module Budget {
    export interface ILoginParams {
        toState: string,
        toParams: string,
    }

    export class LoginCtrl {
        public static IID = "loginCtrl";
        public static controllerAs = LoginCtrl.IID + " as vm";

        public static $inject = [
            "$stateParams",
            "$state",
            "$scope",
            "$log",
            AuthenticationService.IID,
        ];

        constructor(
            private $stateParams: ILoginParams,
            private $state: ng.ui.IStateService,
            $scope: ng.IScope,
            $log: ng.ILogService,
            private authenticationService: IAuthenticationService) {

            $log.debug("Initializing login controller", $stateParams.toState, $stateParams.toParams);
        }

        private once = false;
        public facebook() {
            if (!this.once) {
                this.once = true;
                this.authenticationService.facebookLogin()
                    .then(authData => {
                        this.$state.go(this.$stateParams.toState, angular.fromJson(this.$stateParams.toParams));
                    });
            }
        }
    }
}