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
        $scope = _$rootScope_.$new();
        $log = _$log_;
        $q = _$q_;
        dataService = new BudgetTestData.MockDataService($q);
    }));
    it("gets constructed", function () {
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, dataService);
        expect(controller).not.toBeNull();
    });
    it("calculates original scope correctly", function () {
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, dataService);
        expect($scope.account).not.toBeNull();
        expect($scope.account.subject).toBe('My budget');
        expect($scope.account.description).not.toBeNull();
        expect($scope.debited).toBe(65000);
        expect($scope.credited).toBe(65000);
    });
});
//# sourceMappingURL=account-ctrl-test.js.map