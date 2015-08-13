module Budget {
    'use strict';

    export class NewAccountCtrl {
        public static IID = "newAccountCtrl";

        public static $inject = [
            '$stateParams',
            "$scope",
            "$log",
            DataService.IID,
        ];

        public subject: string;
        public description: string;
        public parentId: string;

        constructor(
            $stateParams,
            $scope: ng.IScope,
            $log: ng.ILogService,
            dataService: IDataService) {

            $log.debug("Initializing new account controller", $stateParams);
            this.parentId = $stateParams.parentId || 'root';
        }

        public add(): void {
            this.subject = '';
            this.description = '';
        }
    }
}