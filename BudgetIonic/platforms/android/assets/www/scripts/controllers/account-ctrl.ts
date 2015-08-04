/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountScope extends ng.IScope {
        accountData: IAccountData;
        account: Account;
    }

    export class AccountCtrl {
        public static $inject = [
            '$scope',
            "$stateParams",
            "$log",
            DataService.IID
        ];

        public static IID = "accountCtrl";

        private _account: Account;

        constructor(
            private $scope: IAccountScope,
            private $stateParams,
            private $log: ng.ILogService,
            private dataService: IDataService) {

            var accountId = $stateParams.accountId || '';

            if (accountId === '') {
                this._account = dataService.getRootAccount();
            } else {
                this._account = dataService.getAccount(accountId);
            }

            $scope.accountData = this._account.snapshot().val();
            $scope.account = this._account;
        }
    }
}