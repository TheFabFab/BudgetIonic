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
        _$q_: ng.IQService,
        $httpBackend: ng.IHttpBackendService) {

        $rootScope = _$rootScope_;
        $scope = <Budget.IAccountScope>_$rootScope_.$new();
        $log = _$log_;
        $q = _$q_;

        $httpBackend.whenGET('templates/budget-list.html').respond(404);

        var resolved = $q.defer();
        resolved.resolve(true);

        accounts = {
            '$getRecord': id => {
                return {
                    $value: BudgetTestData.accounts[id]
                };
            },
            '$loaded': () => resolved.promise        
        };

        transactions = {
            '$getRecord': id => {
                return {
                    $value: BudgetTestData.transactions[id]
                };
            },
            '$loaded': () => resolved.promise
        };

        dataService = {
            getRootAccountKey: () => _(BudgetTestData.accounts).keys()[0],
            accounts: () => <AngularFireArray>accounts,
            transactions: () => <AngularFireArray>transactions,
        };
    }));

    it("gets constructed", () => {
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, $q, dataService);
        expect(controller).not.toBeNull();
    });

    it("calculates original scope correctly", done => {
        var controller = new Budget.AccountCtrl($scope, { accountId: '' }, $log, $q, dataService);

        controller.initDone().then(() => {
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