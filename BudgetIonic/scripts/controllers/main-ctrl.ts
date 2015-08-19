/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IMainScope extends ng.IScope {
        rootAccount: IAccountData;
        contextCommands: Command[];
    }

    export class MainCtrl {
        public static $inject = [
            '$scope',
            "$firebaseObject",
            "$log",
            DataService.IID,
            CommandService.IID,
            'rootAccount',
        ];

        public static resolve() {
            return {
                rootAccount: [DataService.IID, MainCtrl.getAccount],
            };
        }

        public static getAccount(dataService: IDataService): ng.IPromise<FirebaseDataSnapshot> {
            return dataService.getRootAccountSnapshot();
        }

        public static IID = "mainCtrl";

        constructor(
            private $scope: IMainScope,
            private $firebaseObject: AngularFireObjectService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private commandService: CommandService,
            private rootAccount: FirebaseDataSnapshot) {

            console.log("Initializing main controller");

            $firebaseObject(rootAccount.ref()).$bindTo($scope, "rootAccount");
            $scope.contextCommands = commandService.contextCommands;
        }
    }
}