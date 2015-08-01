/// <reference path="../scripts/typings/angularfire/angularfire.d.ts" />
/// <reference path="testdata.ts" />
/// <reference path="../../budgetionic/scripts/services/data-service.ts" />
/// <reference path="../scripts/typings/jasmine/jasmine.d.ts" />
/// <reference path="../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../budgetionic/scripts/controllers/account-ctrl.ts" />
/// <reference path="../scripts/typings/angularjs/angular-mocks.d.ts" />
/// <reference path="../../budgetionic/scripts/app.ts" />
describe("account-ctrl", function () {
    beforeEach(function () { return angular.mock.module('budget-app'); });
    var $controller;
    var $scope;
    var dataService;
    var $log;
    var $q;
    var $rootScope;
    var accounts;
    var transactions;
    beforeEach(inject(function (_$rootScope_, _$log_, _$q_) {
        $rootScope = _$rootScope_;
        $log = _$log_;
        $q = _$q_;
        dataService = new BudgetTestData.MockDataService($q);
    }));
    it("gets constructed", function () {
        $scope = $rootScope.$new();
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, dataService);
        expect(controller).not.toBeNull();
    });
    it("calculates original scope correctly", function () {
        $scope = $rootScope.$new();
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, dataService);
        expect($scope.accountData).not.toBeNull();
        expect($scope.account).not.toBeNull();
        expect($scope.accountData.subject).toBe('My budget');
        expect($scope.accountData.description).not.toBeNull();
        expect($scope.account.debited).toBe(65000);
        expect($scope.account.credited).toBe(65000);
    });
    it("calculates original scope for sub account correctly", function () {
        $scope = $rootScope.$new();
        var rootAccount = dataService.getRootAccount();
        var subAccount = rootAccount.subAccounts[0];
        var controller = new Budget.AccountCtrl($scope, { accountId: subAccount.key() }, $log, dataService);
        expect($scope.accountData).not.toBeNull();
        expect($scope.account).not.toBeNull();
        expect($scope.accountData.subject).toBe('Item1');
        expect($scope.account.debited).toBe(0);
        expect($scope.account.credited).toBe(25000);
    });
    it("recalculates when new transaction is created", function () {
        $scope = $rootScope.$new();
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, dataService);
        var rootAccount = dataService.getRootAccount();
        var transaction = {
            debit: null,
            credit: rootAccount.key(),
            amount: 10000,
            timestamp: Date.now()
        };
        dataService.addTransaction(transaction);
        expect($scope.account.debited).toBe(65000);
        expect($scope.account.credited).toBe(75000);
    });
    it("recalculates when new transaction is created in sub account", function () {
        var rootAccount = dataService.getRootAccount();
        var subAccount = rootAccount.subAccounts[0];
        $scope = $rootScope.$new();
        var controller = new Budget.AccountCtrl($scope, { accountId: subAccount.key() }, $log, dataService);
        var rootAccount = dataService.getRootAccount();
        var subAccount = rootAccount.subAccounts[0];
        var transaction = {
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
//# sourceMappingURL=account-ctrl-test.js.map