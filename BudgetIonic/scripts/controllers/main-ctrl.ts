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
            'rootAccountReference',
        ];

        public static resolve() {
            return {
                rootAccountReference: [DataService.IID, MainCtrl.getAccount],
            };
        }

        public static getAccount(dataService: IDataService): ng.IPromise<Firebase> {
            return dataService.getRootAccountReference();
        }

        public static IID = "mainCtrl";

        constructor(
            private $scope: IMainScope,
            private $firebaseObject: AngularFireObjectService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private commandService: CommandService,
            private rootAccountReference: Firebase) {

            console.log("Initializing main controller");

            $firebaseObject(rootAccountReference).$bindTo($scope, "rootAccount");
            $scope.contextCommands = commandService.contextCommands;
        }
    }
}