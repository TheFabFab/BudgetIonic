/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var AccountCtrl = (function () {
        function AccountCtrl($scope, $stateParams, $log, $q, dataService) {
            var _this = this;
            this.$scope = $scope;
            this.$stateParams = $stateParams;
            this.$log = $log;
            this.$q = $q;
            this.dataService = dataService;
            this._accountId = $stateParams.accountId || '';
            var initDeferred = $q.defer();
            this._initDone = initDeferred.promise;
            dataService.accounts().$loaded().then(function (x) {
                if (_this._accountId === '') {
                    _this._accountId = dataService.getRootAccountKey();
                }
                _this.accountReference = dataService.accounts().$getRecord(_this._accountId);
                $scope.account = _this.accountReference.$value;
                initDeferred.resolve(true);
            });
        }
        AccountCtrl.prototype.initDone = function () {
            return this._initDone;
        };
        AccountCtrl.$inject = [
            '$scope',
            "$stateParams",
            "$log",
            "$q",
            Budget.DataService.IID
        ];
        AccountCtrl.IID = "accountCtrl";
        return AccountCtrl;
    })();
    Budget.AccountCtrl = AccountCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=account-ctrl.js.map