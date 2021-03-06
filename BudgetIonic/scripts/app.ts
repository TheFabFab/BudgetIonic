/// <reference path="controllers/news-feed-ctrl.ts" />
/// <reference path="services/command-service.ts" />
/// <reference path="controllers/new-account-ctrl.ts" />
/// <reference path="directives/account-overview.ts" />
/// <reference path="typings/cordova/cordova.d.ts" />
/// <reference path="typings/cordova-ionic/plugins/keyboard.d.ts" />
/// <reference path="typings/cordova-ionic/cordova-ionic.d.ts" />
/// <reference path="controllers/account-ctrl.ts" />
/// <reference path="data/firebase-service.ts" />
/// <reference path="controllers/main-ctrl.ts" />
/// <reference path="controllers/delete-account-ctrl.ts" />
/// <reference path="controllers/allocate-ctrl.ts" />
/// <reference path="controllers/add-expense-ctrl.ts" />
/// <reference path="controllers/project-ctrl.ts" />
/// <reference path="controllers/login-ctrl.ts" />
/// <reference path="controllers/projects-ctrl.ts" />
/// <reference path="data/firebase-service.ts" />

// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397705
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
module Budget {
    "use strict";

    var budgetModule =
        angular.module("budget-app", ["ionic", "firebase", "angularMoment", "ngCordovaOauth"])

            .service(DataService.IID, DataService)
            .service(AuthenticationService.IID, AuthenticationService)
            .service(CommandService.IID, CommandService)
            .service(Data.FirebaseService.IID, Data.FirebaseService)

            .directive(AccountOverview.IID, AccountOverview.factory())

            .controller(MainCtrl.IID, MainCtrl)
            .controller(AccountCtrl.IID, AccountCtrl)
            .controller(NewAccountCtrl.IID, NewAccountCtrl)
            .controller(DeleteAccountCtrl.IID, DeleteAccountCtrl)
            .controller(AllocateBudgetCtrl.IID, AllocateBudgetCtrl)
            .controller(AddExpenseCtrl.IID, AddExpenseCtrl)
            .controller(LoginCtrl.IID, LoginCtrl)
            .controller(ProjectCtrl.IID, ProjectCtrl)
            .controller(ProjectsCtrl.IID, ProjectsCtrl)
            .controller(NewsFeedCtrl.IID, NewsFeedCtrl);

    budgetModule
        .config(($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider, $locationProvider: ng.ILocationProvider) => {
            console.debug("Configuring routes...");

            $stateProvider
                .state("login", {
                    url: "/login/:toState/:toParams",
                    views: {
                        "main-frame": {
                            controller: LoginCtrl.controllerAs,
                            templateUrl: "./templates/login.html"
                        }
                    }
                });

            $stateProvider.state("app", {
                    abstract: true,
                    url: "/app",
                    views: {
                        "main-frame": {
                            controller: MainCtrl.controllerAs,
                            templateUrl: "./templates/master-page.html"
                        }
                    },
                    resolve: MainCtrl.resolve()
            });

            $stateProvider.state("app.logged-in", {
                abstract: true,
                url: "/budget",
                views: {
                    "right-side-content@app": {
                        templateUrl: "./templates/news-feed.html",
                        controller: NewsFeedCtrl.controllerAs
                    }                    
                }
            });

            $stateProvider.state("app.logged-in.projects", {
                    url: "/projects",
                    views: {
                        "main-content@app": {
                            templateUrl: "./templates/projects.html",
                            controller: ProjectsCtrl.controllerAs
                        }
                    }
                });

            $stateProvider.state("app.logged-in.project", {
                abstract: true,
                url: "/project/:projectId",
                resolve: ProjectCtrl.resolve(),
                views: {
                    "left-side-content@app": {
                        templateUrl: "./templates/project-left-side.html",
                        controller: ProjectCtrl.controllerAs
                    }
                }
            });

            $stateProvider.state("app.logged-in.project.home", {
                url: "/home",
                resolve: AccountCtrl.resolveHome()
            });

            $stateProvider.state("app.logged-in.project.account", {
                url: "/account/:accountId",
                views: {
                    "main-content@app": {
                        templateUrl: "./templates/account.html",
                        resolve: AccountCtrl.resolveAccountSnapshot(),
                        controller: AccountCtrl.controllerAs
                    }
                }
            });

            $stateProvider.state("app.logged-in.project.new", {
                url: "/new/:accountId",
                views: {
                    "main-content@app": {
                        templateUrl: "./templates/new-account.html",
                        resolve: AccountCtrl.resolveAccountSnapshot(),
                        controller: NewAccountCtrl.controllerAs
                    }
                }
            });

            $stateProvider.state("app.logged-in.project.delete-account", {
                url: "/delete/:accountId",
                views: {
                    "main-content@app": {
                        templateUrl: "./templates/delete-account.html",
                        resolve: AccountCtrl.resolveAccountSnapshot(),
                        controller: DeleteAccountCtrl.controllerAs
                    }
                }
            });

            $stateProvider.state("app.logged-in.project.allocate", {
                url: "/allocate/:accountId",
                views: {
                    "main-content@app": {
                        templateUrl: "./templates/allocate.html",
                        resolve: AccountCtrl.resolveAccountSnapshot(),
                        controller: AllocateBudgetCtrl.controllerAs
                    }
                }
            });

            $stateProvider.state("app.logged-in.project.expense", {
                url: "/expense/:accountId",
                views: {
                    "main-content@app": {
                        templateUrl: "./templates/expense.html",
                        resolve: AccountCtrl.resolveAccountSnapshot(),
                        controller: AddExpenseCtrl.controllerAs
                    }
                }
            });

            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise("/app/budget/projects");

            // configure html5 to get links working on jsfiddle
            $locationProvider.html5Mode(false);
        });

    console.log("Module initialized");

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    }

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    }

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
// ReSharper disable Html.EventNotResolved
        document.addEventListener("pause", onPause, false);
        document.addEventListener("resume", onResume, false);
// ReSharper restore Html.EventNotResolved

        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
    }

    export function initialize() {
// ReSharper disable Html.EventNotResolved
        document.addEventListener("deviceready", onDeviceReady, false);
// ReSharper restore Html.EventNotResolved
    }

    function run($ionicPlatform, $rootScope: ng.IRootScopeService, $state: ng.ui.IStateService, $log: ng.ILogService) {
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
        $log.debug("Setting up $rootscope logging...");

        $rootScope.$on("$stateChangeStart", (event, toState, toParams) => {
            $log.debug("$stateChangeStart to " + toState.to + "- fired when the transition begins. toState,toParams : \n", toState, toParams);
        });

        $rootScope.$on("$stateChangeError", (event, toState, toParams, fromState, fromParams) => {
            $log.debug("$stateChangeError - fired when an error occurs during transition.", event, toState, toParams, fromState, fromParams);
        });

        $rootScope.$on("$stateChangeSuccess", (event, toState) => {
            $log.debug("$stateChangeSuccess to " + toState.name + "- fired once the state transition is complete.");
        });

        $rootScope.$on("$viewContentLoaded", event => {
            $log.debug("$viewContentLoaded - fired after dom rendered", event);
        });

        $rootScope.$on("$stateNotFound", (event, unfoundState, fromState, fromParams) => {
            $log.debug("$stateNotFound " + unfoundState.to + "  - fired when a state cannot be found by its name.");
            $log.debug(unfoundState, fromState, fromParams);
        });

        $log.debug("Setting up authentication...");
        $rootScope.$on("$stateChangeError", (event, toState: ng.ui.IState, toParams, fromState, fromParams, reasonData) => {
            if (reasonData.reason === "authentication") {
                event.preventDefault();
                $state.go("login", { toState: toState.name, toParams: angular.toJson(toParams) });
            } else if (reasonData.reason === "redirect") {
                event.preventDefault();
                $state.go(reasonData.state, reasonData.params);
            }
        });
    }

    budgetModule.run(["$ionicPlatform", "$rootScope", "$state", "$log", run]);
}
