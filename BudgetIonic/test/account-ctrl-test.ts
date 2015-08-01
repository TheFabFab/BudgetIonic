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
    var dataService: Budget.IDataService;
    var $log: ng.ILogService;
    var $q: ng.IQService;
    var $rootScope: ng.IRootScopeService;

    var accounts;
    var transactions;

    beforeEach(inject(function (
        _$rootScope_: ng.IRootScopeService,
        _$log_: ng.ILogService,
        _$q_: ng.IQService) {

        $rootScope = _$rootScope_;
        $scope = <Budget.IAccountScope>_$rootScope_.$new();
        $log = _$log_;
        $q = _$q_;

        dataService = new BudgetTestData.MockDataService($q);
    }));

    it("gets constructed", () => {
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, dataService);
        expect(controller).not.toBeNull();
    });

    it("calculates original scope correctly", () => {
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, dataService);

        expect($scope.account).not.toBeNull();
        expect($scope.account.subject).toBe('My budget');
        expect($scope.account.description).not.toBeNull();
        expect($scope.debited).toBe(65000);
        expect($scope.credited).toBe(65000);
    });
});