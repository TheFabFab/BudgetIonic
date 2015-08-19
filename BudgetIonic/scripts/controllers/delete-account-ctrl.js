var Budget;
(function (Budget) {
    'use strict';
    var DeleteAccountCtrl = (function () {
        function DeleteAccountCtrl($stateParams, $ionicHistory, $log, dataService) {
            this.$ionicHistory = $ionicHistory;
            this.dataService = dataService;
            $log.debug("Initializing delete account controller", $stateParams);
            this.accountId = $stateParams.accountId || 'root';
            this.dataService.getAccountSnapshot(this.accountId)
                .then(function (snapshot) {
            });
        }
        DeleteAccountCtrl.prototype.ok = function () {
            var _this = this;
            this.dataService.deleteAccount(this.accountId)
                .then(function (x) { return _this.$ionicHistory.goBack(); });
        };
        DeleteAccountCtrl.prototype.cancel = function () {
            this.$ionicHistory.goBack();
        };
        DeleteAccountCtrl.IID = "deleteAccountCtrl";
        DeleteAccountCtrl.$inject = [
            '$stateParams',
            '$ionicHistory',
            '$log',
            Budget.DataService.IID
        ];
        return DeleteAccountCtrl;
    })();
    Budget.DeleteAccountCtrl = DeleteAccountCtrl;
})(Budget || (Budget = {}));
//# sourceMappingURL=delete-account-ctrl.js.map