﻿/// <reference path="../services/authentication-service.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export class MainCtrl {
        public static IID = "mainCtrl";
        public static controllerAs = MainCtrl.IID + " as vm";

        public static resolve() {
            return {
                userData: ["$q", "$log", AuthenticationService.IID, MainCtrl.authenticate]
            };
        }

        private static authenticate($q: ng.IQService, $log: ng.ILogService, authenticationService: IAuthenticationService): ng.IPromise<UserData> {
            var deferred = $q.defer<UserData>();

            // TODO: sign up for de-authentication
            authenticationService.initialized
                .then(x => {
                    let userData = authenticationService.userData;
                    $log.debug("User data", userData);
                    if (userData) {
                        deferred.resolve(userData);
                    } else {
                        deferred.reject("authentication");
                    }
                });

            return deferred.promise;
        }

        public contextCommands: Command[];
        public imageStyle;

        public static $inject = [
            "$scope",
            "$state",
            "$log",
            "$ionicSideMenuDelegate",
            DataService.IID,
            AuthenticationService.IID,
            CommandService.IID,
            "userData"
        ];

        constructor(
            private $scope: ng.IScope,
            private $state: ng.ui.IStateService,
            private $log: ng.ILogService,
            private $ionicSideMenuDelegate,
            private dataService: IDataService,
            private authenticationService: IAuthenticationService,
            private commandService: CommandService,
            public userData: UserData) {

            console.log("Initializing main controller");

            $scope.$watch(_ => this.authenticationService.userData, _ => {
                $state.reload();
            });

            this.contextCommands = commandService.contextCommands;
            this.imageStyle = {
                "background-image": `url('${userData.cachedProfileImage}')`
            };

            $log.debug("imageStyle", this.imageStyle);
        }

        public logOut(): void {
            this.authenticationService.logOut();
            this.$state.go("logged-in.home", {}, { reload: true });
        }

        public toggleLeft(): void {
            this.$ionicSideMenuDelegate.toggleLeft();
        }

        public toggleRight(): void {
            this.$ionicSideMenuDelegate.toggleRight();
        }
    }
}