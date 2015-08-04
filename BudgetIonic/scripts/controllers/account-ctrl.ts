/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountScope extends ng.IScope {
        accountData: IAccountData;
        account: Account;
    }

    interface IAccountStateParams {
        accountId: string;
    }

    export class AccountCtrl {
        public static $inject = [
            '$scope',
            "$stateParams",
            "$firebaseObject",
            "$log",
            DataService.IID
        ];

        public static IID = "accountCtrl";

        private _account: Account;

        constructor(
            private $scope: IAccountScope,
            private $stateParams: IAccountStateParams,
            private $firebaseObject: AngularFireObjectService,
            private $log: ng.ILogService,
            private dataService: IDataService) {

            var accountId = $stateParams.accountId || '';

            if (accountId === '') {
                this._account = dataService.getRootAccount();
            } else {
                this._account = dataService.getAccount(accountId);
            }

            $firebaseObject(this._account.firebaseObject()).$bindTo($scope, "accountData");
            $scope.account = this._account;
        }
    }
}