/// <reference path="../services/authentication-service.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export class MainCtrl {
        public static IID = "mainCtrl";
        public static controllerAs = MainCtrl.IID + " as vm";

        public static resolve() {
            return {
                userData: ["$q", "$log", AuthenticationService.IID, MainCtrl.authenticate],
                rootAccountSnapshot: [DataService.IID, MainCtrl.getAccount],
            };
        }

        private static authenticate($q: ng.IQService, $log: ng.ILogService, authenticationService: IAuthenticationService): ng.IPromise<UserData> {
            var deferred = $q.defer<UserData>();

            authenticationService.initialized
                .then(x => {
                    let userData = authenticationService.userData;
                    $log.debug("User data", userData);
                    if (userData) {
                        deferred.resolve(userData);
                    } else {
                        deferred.reject("authentication");
                    }
                })

            return deferred.promise;
        }

        private static getAccount(dataService: IDataService): ng.IPromise<FirebaseDataSnapshot> {
            return dataService.getRootAccountSnapshot();
        }

        public contextCommands: Command[];
        public rootAccount: AccountData;
        public imageStyle;

        public static $inject = [
            '$scope',
            "$state",
            "$firebaseObject",
            "$log",
            DataService.IID,
            AuthenticationService.IID,
            CommandService.IID,
            "userData",
            "rootAccountSnapshot",
        ];

        constructor(
            private $scope: ng.IScope,
            private $state: ng.ui.IStateService,
            private $firebaseObject: AngularFireObjectService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private authenticationService: IAuthenticationService,
            private commandService: CommandService,
            public userData: UserData,
            rootAccountSnapshot: FirebaseDataSnapshot) {

            console.log("Initializing main controller");

            this.rootAccount = AccountData.fromSnapshot(rootAccountSnapshot);
            this.contextCommands = commandService.contextCommands;
            this.imageStyle = {
                "background-image": "url('" + userData.cachedProfileImage + "')"
            };

            $log.debug("imageStyle", this.imageStyle);
        }

        public logOut(): void {
            this.authenticationService.logOut();
            this.$state.go("app.home", {}, { reload: true });
        }
    }
}