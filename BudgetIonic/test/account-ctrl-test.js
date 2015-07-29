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
    beforeEach(inject(function (_$rootScope_, _$log_, _$q_, $httpBackend) {
        $rootScope = _$rootScope_;
        $scope = _$rootScope_.$new();
        $log = _$log_;
        $q = _$q_;
        $httpBackend.whenGET('templates/budget-list.html').respond(404);
        var resolved = $q.defer();
        resolved.resolve(true);
        accounts = {
            '$getRecord': function (id) {
                return {
                    $value: BudgetTestData.accounts[id]
                };
            },
            '$loaded': function () { return resolved.promise; }
        };
        transactions = {
            '$getRecord': function (id) {
                return {
                    $value: BudgetTestData.transactions[id]
                };
            },
            '$loaded': function () { return resolved.promise; }
        };
        dataService = {
            getRootAccountKey: function () { return _(BudgetTestData.accounts).keys()[0]; },
            accounts: function () { return accounts; },
            transactions: function () { return transactions; },
        };
    }));
    it("gets constructed", function () {
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, $q, dataService);
        expect(controller).not.toBeNull();
    });
    it("calculates original scope correctly", function (done) {
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, $q, dataService);
        controller.initDone().then(function () {
            expect($scope.account).not.toBeNull();
            expect($scope.account.subject).toBe('My budget');
            expect($scope.debited).toBe(65000);
            expect($scope.credited).toBe(65000);
            console.log("Done!");
            done();
        });
        $rootScope.$apply();
    });
});
//# sourceMappingURL=account-ctrl-test.js.map