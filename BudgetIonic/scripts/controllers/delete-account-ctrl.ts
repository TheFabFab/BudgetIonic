module Budget {
    'use strict';

    export class DeleteAccountCtrl {
        public static IID = "deleteAccountCtrl";

        public static $inject = [
            '$stateParams',
            '$ionicHistory',
            '$log',
            DataService.IID
        ];

        private accountId: string;
        public account: IAccountData;

        constructor(
            $stateParams,
            private $ionicHistory,
            $log: ng.ILogService,
            private dataService: IDataService) {

            $log.debug("Initializing delete account controller", $stateParams);
            this.accountId = $stateParams.accountId || 'root';

            this.dataService.getAccountSnapshot(this.accountId)
                .then(snapshot => {
                    this.account = <IAccountData>snapshot.exportVal();
                });
        }

        public ok(): void {
            this.dataService.deleteAccount(this.accountId)
                .then(x => this.$ionicHistory.goBack(2));
        }

        public cancel(): void {
            this.$ionicHistory.goBack();
        }
    }
}