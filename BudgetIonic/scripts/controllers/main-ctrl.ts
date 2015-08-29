/// <reference path="../services/authentication-service.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export class MainCtrl {
        public static IID = "mainCtrl";
        public static controllerAs = MainCtrl.IID + " as vm";

        public static resolve() {
            return {
                authData: ["$q", "$state", AuthenticationService.IID, MainCtrl.authenticate],
                rootAccountSnapshot: [DataService.IID, MainCtrl.getAccount],
            };
        }

        private static authenticate($q: ng.IQService, $state: ng.ui.IStateService, authenticationService: IAuthenticationService): ng.IPromise<FirebaseAuthData> {
            var deferred = $q.defer<FirebaseAuthData>();

            var authCallback = authData => {
                if (authData !== null) {
                    deferred.resolve(authData);
                } else {
                    deferred.reject("authentication");
                }
            };

            authenticationService.onAuth(authCallback);
            return deferred.promise.then(x => {
                authenticationService.offAuth(authCallback);
                return x;
            });
        }

        private static getAccount(dataService: IDataService): ng.IPromise<FirebaseDataSnapshot> {
            return dataService.getRootAccountSnapshot();
        }

        public contextCommands: Command[];
        public rootAccount: AccountData;

        public static $inject = [
            '$scope',
            "$state",
            "$firebaseObject",
            "$log",
            DataService.IID,
            AuthenticationService.IID,
            CommandService.IID,
            "authData",
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
            private authData: FirebaseAuthData,
            rootAccountSnapshot: FirebaseDataSnapshot) {

            console.log("Initializing main controller");

            this.rootAccount = AccountData.fromSnapshot(rootAccountSnapshot);
            this.contextCommands = commandService.contextCommands;
        }

        public logOut(): void {
            this.authenticationService.logOut();
            this.$state.go("app.home", {}, { reload: true });
        }

        private onAuthenticationChanged(authData: FirebaseAuthData) {
            if (authData == null) {
                this.$state.go("login");
            } else {
            }
        }
    }
}