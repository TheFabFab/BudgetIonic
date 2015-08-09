/// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
module Budget {
    'use strict';

    export interface IAccountScope extends ng.IScope {
        accountData: IAccountData;
        subAccounts: AngularFireArray;
        creditTransactions: AngularFireArray;
        debitTransactions: AngularFireArray;
        addSubAccount: () => void;
        newAccount: NewAccount;
    }

    class NewAccount {
        public subject: string;
    }

    interface IAccountStateParams {
        accountId: string;
    }

    export class AccountCtrl {
        public static IID = "accountCtrl";

        public static resolve() {
            return {
                accountReference: ['$stateParams', DataService.IID, AccountCtrl.getAccount],
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
            "accountReference",
        ];

        constructor(
            private $scope: IAccountScope,
            private $firebaseObject: AngularFireObjectService,
            private $firebaseArray: AngularFireArrayService,
            private $log: ng.ILogService,
            private dataService: IDataService,
            private accountReference: Firebase) {

            $log.debug("Initializing account controller", arguments);

            $firebaseObject(accountReference).$bindTo($scope, "accountData");

            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");

            var childrenQuery =
                accounts
                .orderByChild("parent")
                .equalTo(accountReference.key());

            $scope.subAccounts = $firebaseArray(childrenQuery);

            var transactions = new Firebase("https://budgetionic.firebaseio.com/transactions");

            var creditTransactionQuery =
                transactions
                    .orderByChild("credit")
                    .equalTo(accountReference.key());

            $scope.creditTransactions = $firebaseArray(creditTransactionQuery);

            var debitTransactionQuery =
                transactions
                    .orderByChild("debit")
                    .equalTo(accountReference.key());

            $scope.debitTransactions = $firebaseArray(debitTransactionQuery);

            $scope.newAccount = new NewAccount();
            $scope.addSubAccount = () => this.addSubAccountCore();
        }

        private addSubAccountCore(): void {
            this.$log.debug("Adding sub account with subject in controller: " + this.$scope.newAccount.subject);
            this.$scope.newAccount.subject = '';
        }
    }
}