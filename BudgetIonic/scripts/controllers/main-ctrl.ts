/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IMainScope extends ng.IScope {
        rootAccountData: IAccountData;
        rootAccount: Account;
    }

    export class MainCtrl {
        public static $inject = [
            '$scope',
            "$firebaseObject",
            "$log",
            DataService.IID
        ];

        public static IID = "mainCtrl";

        private _rootAccount: Account;

        constructor(
            private $scope: IMainScope,
            private $firebaseObject: AngularFireObjectService,
            private $log: ng.ILogService,
            private dataService: IDataService) {

            console.log("Initializing main controller");
            this._rootAccount = dataService.getRootAccount();

            $firebaseObject(this._rootAccount.firebaseObject()).$bindTo($scope, "rootAccountData");
            $scope.rootAccount = this._rootAccount;
        }
    }
}