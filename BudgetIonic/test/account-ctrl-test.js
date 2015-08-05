/// <reference path="../scripts/typings/angularfire/angularfire.d.ts" />
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
    var $log;
    var $q;
    var $rootScope;
    var accounts;
    var transactions;
    var $firebaseObject = (function (firebase) {
        return {
            $bindTo: function (scope, name) {
                scope[name] = firebase.$$mockVal();
            }
        };
    });
    beforeEach(inject(function (_$rootScope_, _$log_, _$q_) {
        $rootScope = _$rootScope_;
        $log = _$log_;
        $q = _$q_;
    }));
});
//# sourceMappingURL=account-ctrl-test.js.map