/// <reference path="../../typings/rx/rx.d.ts" />
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
            "$log",
            AuthenticationService.IID
        ];

        constructor(
            private $stateParams: ILoginParams,
            private $state: ng.ui.IStateService,
            private $log: ng.ILogService,
            private authenticationService: IAuthenticationService) {

            $log.debug("Initializing login controller", $stateParams.toState, $stateParams.toParams);
        }

        private once = false;
        public facebook() {
            if (!this.once) {
                this.once = true;

                this.authenticationService.authentication.first(userData => !!userData)
                    .subscribe(userData => {
                        this.$log.debug("onNext in loginCtrl", userData);

                        if (userData) {
                            this.$state.go(this.$stateParams.toState, angular.fromJson(this.$stateParams.toParams));
                        }
                    });

                this.authenticationService.facebookLogin();
            }
        }
    }
}