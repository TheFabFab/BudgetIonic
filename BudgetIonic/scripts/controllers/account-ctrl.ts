/// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountScope extends ng.IScope {
        accountData: IAccountData;
        subAccounts: AngularFireArray;
    }

    interface IAccountStateParams {
        accountId: string;
    }

    export class AccountCtrl {
        public static IID = "accountCtrl";

        private _account: Account;

        public static resolve() {
            return {
                account: ['$stateParams', DataService.IID, AccountCtrl.getAccount],
            };
        }

        public static getAccount(
            $stateParams: IAccountStateParams,
            dataService: IDataService): ng.IPromise<Firebase> {
            console.log("Getting account: ");
            console.log($stateParams);
            var accountId = $stateParams.accountId || '';

            return dataService.getAccountReference(accountId);
        }

        public static $inject = [
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            DataService.IID,
            "account",
        ];

        constructor(
            private $scope: IAccountScope,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private account: Firebase) {

            console.log("Initializing account controller");
            console.log(arguments);

            $firebaseObject(account).$bindTo($scope, "accountData");

            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");

            var childrenQuery =
                accounts
                .orderByChild("parent")
                .equalTo(account.key());

            console.log(account.key());
            $scope.subAccounts = $firebaseArray(childrenQuery);

            $scope.subAccounts.$loaded(x => {
                console.log($scope.subAccounts);
            });
        }
    }
}