module Budget {
    'use strict';

    export class NewAccountCtrl {
        public static IID = "newAccountCtrl";

        public static $inject = [
            '$stateParams',
            '$ionicHistory',
            "$scope",
            "$log",
            DataService.IID,
        ];

        public subject: string = '';
        public description: string = '';
        public parentId: string;

        constructor(
            $stateParams,
            private ionicHistory,
            $scope: ng.IScope,
            $log: ng.ILogService,
            private dataService: IDataService) {

            $log.debug("Initializing new account controller", $stateParams);
            this.parentId = $stateParams.parentId || 'root';
        }

        public ok(): void {
            this.dataService.addChildAccount(this.parentId, this.subject, this.description)
                .then(x => this.ionicHistory.goBack());
        }

        public cancel(): void {
            this.ionicHistory.goBack();
        }
    }
}