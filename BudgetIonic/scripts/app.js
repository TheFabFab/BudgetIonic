/// <reference path="typings/cordova-ionic/plugins/keyboard.d.ts" />
/// <reference path="typings/cordova-ionic/cordova-ionic.d.ts" />
/// <reference path="controllers/budgetctrl.ts" />
/// <reference path="controllers/sidemenuctrl.ts" />
/// <reference path="typings/cordova/cordova.d.ts" />
/// <reference path="services/model-service.ts" />
/// <reference path="controllers/account-ctrl.ts" />
/// <reference path="services/data-service.ts" />
/// <reference path="controllers/main-ctrl.ts" />
/// <reference path="typings/angular-ui-router/angular-ui-router.d.ts" />
// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397705
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
var Budget;
(function (Budget) {
    "use strict";
    var budgetModule = angular.module('budget-app', ['ionic', 'firebase'])
        .service(DataService.IID, DataService)
        .service(ModelService.IID, ModelService)
        .controller(BudgetItemCtrl.IID, BudgetItemCtrl)
        .controller(SideMenuCtrl.IID, SideMenuCtrl)
        .controller(MainCtrl.IID, MainCtrl)
        .controller(AccountCtrl.IID, AccountCtrl)
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
        .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
        $stateProvider
            .state("app", {
            url: "/budget/",
            abstract: true,
            resolve: {
                delay: ['$q', DataService.IID, function ($q, dataService) {
                        console.log("Resolving app state...");
                        return dataService.loaded();
                    }]
            }
        })
            .state("app.budget", {
            url: "/budget/home/",
            templateUrl: "templates/budget-list.html",
            controller: BudgetItemCtrl.IID,
        });
    });
    //$stateProvider.state("app.budget-item-detail", {
    //    url: "/budget/account/:itemid",
    //    templateUrl: "templates/budget-list.html",
    //    controller: BudgetItemCtrl.IID,
    //    resolve: {
    //        delay: ['$q', DataService.IID, ($q, $dataService: IDataService) => {
    //            console.log("Resolving detail state...");
    //            return $dataService.loaded();
    //        }]
    //    }
    //});
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/budget/home/');
    // configure html5 to get links working on jsfiddle
    $locationProvider.html5Mode(false);
})(Budget || (Budget = {}));
;
console.log("Module initialized");
function initialize() {
    document.addEventListener('deviceready', onDeviceReady, false);
}
exports.initialize = initialize;
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
//# sourceMappingURL=app.js.map