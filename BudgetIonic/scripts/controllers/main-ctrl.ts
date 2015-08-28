/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export class MainCtrl {
        public static $inject = [
            '$scope',
            "$firebaseObject",
            "$log",
            DataService.IID,
            CommandService.IID,
            'rootAccountSnapshot',
        ];

        public static resolve() {
            return {
                rootAccountSnapshot: [DataService.IID, MainCtrl.getAccount],
            };
        }

        public static getAccount(dataService: IDataService): ng.IPromise<FirebaseDataSnapshot> {
            return dataService.getRootAccountSnapshot();
        }

        public static IID = "mainCtrl";
        public static controllerAs = MainCtrl.IID + " as vm";

        public contextCommands: Command[];
        public rootAccount: AccountData;

        constructor(
            private $scope: ng.IScope,
            private $firebaseObject: AngularFireObjectService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private commandService: CommandService,
            rootAccountSnapshot: FirebaseDataSnapshot) {

            console.log("Initializing main controller");

            this.rootAccount = AccountData.fromSnapshot(rootAccountSnapshot);
            this.contextCommands = commandService.contextCommands;
        }
    }
}