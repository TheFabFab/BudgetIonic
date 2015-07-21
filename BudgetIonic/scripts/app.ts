/// <reference path="controllers/budgetctrl.ts" />
/// <reference path="controllers/mainctrl.ts" />
/// <reference path="controllers/sidemenuctrl.ts" />
/// <reference path="services/model-service.ts" />

// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397705
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
module Budget {
    "use strict";

    var budgetModule =
        angular.module('budget-app', ["ui.router", 'ionic'])
        .controller(MainCtrl.IID, MainCtrl)
        .controller(BudgetCtrl.IID, BudgetCtrl)
        .controller(SideMenuCtrl.IID, SideMenuCtrl)
        .service(ModelService.IID, ModelService)

        .run(function ($ionicPlatform) {
            $ionicPlatform.ready(function () {
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
        })
        .config(($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider, $locationProvider: ng.ILocationProvider) => {
            $stateProvider.state("app", {
                url: "/budget/list",
                templateUrl: "templates/budget-list.html",
                controller: MainCtrl.IID
            });

            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise('/budget/list');

            // configure html5 to get links working on jsfiddle
            $locationProvider.html5Mode(true);
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
