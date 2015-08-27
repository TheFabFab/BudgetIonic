/// <reference path="services/command-service.ts" />
/// <reference path="services/data-service.ts" />
/// <reference path="controllers/new-account-ctrl.ts" />
/// <reference path="directives/account-overview.ts" />
/// <reference path="typings/cordova/cordova.d.ts" />
/// <reference path="typings/cordova-ionic/plugins/keyboard.d.ts" />
/// <reference path="typings/cordova-ionic/cordova-ionic.d.ts" />
/// <reference path="controllers/account-ctrl.ts" />
/// <reference path="controllers/main-ctrl.ts" />
/// <reference path="controllers/delete-account-ctrl.ts" />
/// <reference path="controllers/allocate-ctrl.ts" />
/// <reference path="controllers/add-expense-ctrl.ts" />

// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397705
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
module Budget {
    "use strict";

    var budgetModule =
        angular.module('budget-app', ['ionic', 'firebase', 'angularMoment'])
            .service(DataService.IID, DataService)
            .service(CommandService.IID, CommandService)
            .directive(AccountOverview.IID, AccountOverview.factory())
            .controller(MainCtrl.IID, MainCtrl)
            .controller(AccountCtrl.IID, AccountCtrl)
            .controller(NewAccountCtrl.IID, NewAccountCtrl)
            .controller(DeleteAccountCtrl.IID, DeleteAccountCtrl)
            .controller(AllocateBudgetCtrl.IID, AllocateBudgetCtrl)
            .controller(AddExpenseCtrl.IID, AddExpenseCtrl);


    budgetModule
        .run(function ($ionicPlatform, $rootScope: ng.IRootScopeService) {
            $ionicPlatform.ready(() => {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    // org.apache.cordova.statusbar required
                    window.StatusBar.styleLightContent();
                }
            });

            // Credits: Adam's answer in http://stackoverflow.com/a/20786262/69362
            console.log("Setting up $rootscope logging...");

            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                console.log('$stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
            });

            $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams) {
                console.log('$stateChangeError - fired when an error occurs during transition.');
                console.log(arguments);
            });

            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                console.log('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');
            });

            $rootScope.$on('$viewContentLoaded', function (event) {
                console.log('$viewContentLoaded - fired after dom rendered', event);
            });

            $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
                console.log('$stateNotFound ' + unfoundState.to + '  - fired when a state cannot be found by its name.');
                console.log(unfoundState, fromState, fromParams);
            });
        })
    ;

    budgetModule
        .config(($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider, $locationProvider: ng.ILocationProvider) => {
            console.log("Configuring routes...");

            $stateProvider
                 
                .state("app", {
                    abstract: true,
                    url: "/budget",
                    views: {
                        'main-frame': {
                            controller: MainCtrl.IID,
                            templateUrl: "templates/master-page.html",
                        },
                    },
                    resolve: MainCtrl.resolve()
                })

                .state("app.budget", {
                    url: "/home",
                    views: {
                        'main-content': {
                            templateUrl: "templates/account.html",
                            resolve: AccountCtrl.resolve(),
                            controller: AccountCtrl.IID,
                        },
                    },
                });

            $stateProvider.state("app.budget-account", {
                url: "/account/:accountId",
                views: {
                    'main-content': {
                        templateUrl: "templates/account.html",
                        resolve: AccountCtrl.resolve(),
                        controller: AccountCtrl.IID,
                    },
                },
            });

            $stateProvider.state("app.new-account", {
                url: "/new/:parentId",
                views: {
                    'main-content': {
                        templateUrl: "templates/new-account.html",
                        //resolve: AccountCtrl.resolve(),   
                        //controller: NewAccountCtrl.IID,
                        //controllerAs: 'newAccount',
                    },
                },
            });

            $stateProvider.state("app.delete-account", {
                url: "/delete/:accountId",
                views: {
                    'main-content': {
                        templateUrl: "templates/delete-account.html",
                        //resolve: AccountCtrl.resolve(),   
                        //controller: NewAccountCtrl.IID,
                        //controllerAs: 'newAccount',
                    },
                },
            });

            $stateProvider.state("app.allocate", {
                url: "/allocate/:accountId",
                views: {
                    'main-content': {
                        templateUrl: "templates/allocate.html",
                        //resolve: AllocateBudgetCtrl.resolve(),   
                        //controller: NewAccountCtrl.IID,
                        //controllerAs: 'newAccount',
                    },
                },
            });

            $stateProvider.state("app.expense", {
                url: "/expense/:accountId",
                views: {
                    'main-content': {
                        templateUrl: "templates/expense.html",
                        //resolve: AllocateBudgetCtrl.resolve(),   
                        //controller: NewAccountCtrl.IID,
                        //controllerAs: 'newAccount',
                    },
                },
            });

            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise('/budget/account/root');

            // configure html5 to get links working on jsfiddle
            $locationProvider.html5Mode(false);
        });

    console.log("Module initialized");

    export function initialize() {
        document.addEventListener('deviceready', onDeviceReady, false);
    }

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener('pause', onPause, false);
        document.addEventListener('resume', onResume, false);

        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
    }

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    }

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    }
}
