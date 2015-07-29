/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountScope extends ng.IScope {
        account: IAccount;
        debited: number;
        credited: number;
    }

    export class AccountCtrl {
        public static $inject = [
            '$scope',
            "$stateParams",
            "$log",
            "$q",
            DataService.IID
        ];

        public static IID = "accountCtrl";

        private _accountId: string;
        private accountReference: AngularFireSimpleObject;
        private _initDone: ng.IPromise<boolean>;

        constructor(
            private $scope: IAccountScope,
            private $stateParams,
            private $log: ng.ILogService,
            private $q: ng.IQService,
            private dataService: IDataService) {

            this._accountId = $stateParams.accountId || '';

            var initDeferred = $q.defer();
            this._initDone = initDeferred.promise;

            dataService.accounts().$loaded().then(x => {
                if (this._accountId === '') {
                    this._accountId = dataService.getRootAccountKey();
                }

                this.accountReference = dataService.accounts().$getRecord(this._accountId);

                $scope.account = this.accountReference.$value;
                initDeferred.resolve(true);
            });
        }

        public initDone(): ng.IPromise<boolean> {
            return this._initDone;
        }
    }
}