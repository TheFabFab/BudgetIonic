/// <reference path="../scripts/typings/angularfire/angularfire.d.ts" />
/// <reference path="testdata.ts" />
/// <reference path="../../budgetionic/scripts/services/data-service.ts" />
/// <reference path="../scripts/typings/jasmine/jasmine.d.ts" />
/// <reference path="../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../budgetionic/scripts/controllers/account-ctrl.ts" />
/// <reference path="../scripts/typings/angularjs/angular-mocks.d.ts" />
/// <reference path="../../budgetionic/scripts/app.ts" />

describe("account-ctrl", () => {
    beforeEach(() => angular.mock.module('budget-app'));

    var $controller: Budget.AccountCtrl;
    var $scope: Budget.IAccountScope;
    var dataService: BudgetTestData.MockDataService;
    var $log: ng.ILogService;
    var $q: ng.IQService;
    var $rootScope: ng.IRootScopeService;

    var accounts;
    var transactions;

    var $firebaseObject = <AngularFireObjectService>((firebase: Firebase) => {
        return {
            $bindTo: (scope, name) => {
                scope[name] = (<any>firebase).$$mockVal();
            }
        };
    });

    beforeEach(inject(function (
        _$rootScope_: ng.IRootScopeService,
        _$log_: ng.ILogService,
        _$q_: ng.IQService) {

        $rootScope = _$rootScope_;
        $log = _$log_;
        $q = _$q_;

        dataService = new BudgetTestData.MockDataService($q);
    }));

    it("gets constructed", () => {
        $scope = <Budget.IAccountScope>$rootScope.$new();
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $firebaseObject, $log, dataService);
        expect(controller).not.toBeNull();
    });

    it("calculates original scope correctly", () => {
        $scope = <Budget.IAccountScope>$rootScope.$new();
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $firebaseObject, $log, dataService);

        expect($scope.accountData).not.toBeNull();
        expect($scope.account).not.toBeNull();
        expect($scope.accountData.subject).toBe('My budget');
        expect($scope.accountData.description).not.toBeNull();
        expect($scope.account.debited).toBe(65000);
        expect($scope.account.credited).toBe(65000);
    });

    it("calculates original scope for sub account correctly", () => {
        $scope = <Budget.IAccountScope>$rootScope.$new();
        var rootAccount = dataService.getRootAccount();
        var subAccount = rootAccount.subAccounts[0];

        var controller = new Budget.AccountCtrl($scope, { accountId: subAccount.key() }, $firebaseObject, $log, dataService);

        expect($scope.accountData).not.toBeNull();
        expect($scope.account).not.toBeNull();
        expect($scope.accountData.subject).toBe('Item1');
        expect($scope.account.debited).toBe(0);
        expect($scope.account.credited).toBe(25000);
    });

    it("recalculates when new transaction is created", () => {
        $scope = <Budget.IAccountScope>$rootScope.$new();
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $firebaseObject, $log, dataService);

        var rootAccount = dataService.getRootAccount();
        var transaction: Budget.ITransactionData = {
            debit: null,
            credit: rootAccount.key(),
            amount: 10000,
            timestamp: Date.now()
        };

        dataService.addTransaction(transaction);
        expect($scope.account.debited).toBe(65000);
        expect($scope.account.credited).toBe(75000);
    });

    it("recalculates when new transaction is created in sub account", () => {
        var rootAccount = dataService.getRootAccount();
        var subAccount = rootAccount.subAccounts[0];

        $scope = <Budget.IAccountScope>$rootScope.$new();
        var controller = new Budget.AccountCtrl($scope, { accountId: subAccount.key() }, $firebaseObject, $log, dataService);

        var rootAccount = dataService.getRootAccount();
        var subAccount = rootAccount.subAccounts[0];
        var transaction: Budget.ITransactionData = {
            debit: rootAccount.key(),
            credit: subAccount.key(),
            amount: 10000,
            timestamp: Date.now()
        };

        dataService.addTransaction(transaction);
        expect($scope.account.debited).toBe(0);
        expect($scope.account.credited).toBe(35000);
    });
});