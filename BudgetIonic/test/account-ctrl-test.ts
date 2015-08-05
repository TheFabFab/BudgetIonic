/// <reference path="../scripts/typings/angularfire/angularfire.d.ts" />
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
    }));
});