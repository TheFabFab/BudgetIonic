/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountScope extends ng.IScope {
        account: IAccountData;
        debited: number;
        credited: number;
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
                // TODO: this._account = dataService.getAccount(accountId);
            }

            $scope.account = this._account.snapshot().val();
            $scope.debited = this._account.debited();
            $scope.credited = this._account.credited();
        }
    }
}