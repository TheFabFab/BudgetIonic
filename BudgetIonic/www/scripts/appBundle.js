var Budget;
(function (Budget) {
    var BudgetTransaction = (function () {
        function BudgetTransaction(_spent, _reduced, _date, _user) {
            if (_date === void 0) { _date = Date.now(); }
            if (_user === void 0) { _user = 'admin'; }
            this._spent = _spent;
            this._reduced = _reduced;
            this._date = _date;
            this._user = _user;
        }
        BudgetTransaction.prototype.spent = function () {
            return this._spent;
        };
        BudgetTransaction.prototype.reduced = function () {
            return this._reduced;
        };
        return BudgetTransaction;
    })();
    Budget.BudgetTransaction = BudgetTransaction;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    var LiteEvent = (function () {
        function LiteEvent() {
            this.handlers = [];
        }
        LiteEvent.prototype.on = function (handler) {
            this.handlers.push(handler);
        };
        LiteEvent.prototype.off = function (handler) {
            this.handlers = this.handlers.filter(function (h) { return h !== handler; });
        };
        LiteEvent.prototype.trigger = function (data) {
            if (this.handlers) {
                this.handlers.slice(0).forEach(function (h) { return h(data); });
            }
        };
        return LiteEvent;
    })();
    Budget.LiteEvent = LiteEvent;
})(Budget || (Budget = {}));
/// <reference path="../typings/underscore-observable-arrays/underscore-observable-arrays.d.ts" />
/// <reference path="budget-transaction.ts" />
/// <reference path="lite-events.ts" />
var Budget;
(function (Budget) {
    var BudgetItem = (function () {
        function BudgetItem(id, subject, description, planned, spent, remaining, subitems, transactions) {
            var _this = this;
            if (subitems === void 0) { subitems = []; }
            if (transactions === void 0) { transactions = []; }
            this.id = id;
            this.subject = subject;
            this.description = description;
            this.planned = planned;
            this.spent = spent;
            this.remaining = remaining;
            this.subitems = subitems;
            this.transactions = transactions;
            this.changed = new Budget.LiteEvent();
            _.observe(transactions, function (new_array, old_array) { return _this.transactionsUpdated(new_array, old_array); });
            _.observe(subitems, function (new_array, old_array) { return _this.subitemsUpdated(new_array, old_array); });
            this.subitems.forEach(function (x) { return x.changed.on(function (child) { return _this.onChildChanged(child); }); });
            this.recalculate();
        }
        BudgetItem.prototype.calculateProgressPath = function () {
            var alpha = 2 * Math.PI * this.progress / 100;
            var x = 40 + 35 * Math.sin(alpha);
            var y = 40 - 35 * Math.cos(alpha);
            var largeArcFlag = this.progress > 50 ? 1 : 0;
            this.progressPath = 'M40,5 A35,35 0 ' + largeArcFlag + ',1 ' + x + ',' + y;
            this.xArcEnd = x;
            this.yArcEnd = y;
        };
        BudgetItem.prototype.getAllTransactions = function () {
            var allTransactions = this.transactions.map(function (x) { return x; });
            return allTransactions;
        };
        BudgetItem.prototype.recalculate = function () {
            var spent = 0;
            var remaining = 0;
            this.transactions.forEach(function (x) {
                spent += x.spent();
                remaining += -x.reduced;
            });
            this.subitems.forEach(function (x) {
                spent += x.spent;
                remaining += x.remaining;
            });
            var changed = this.spent != spent || this.remaining != remaining;
            if (changed) {
                this.spent = spent;
                this.remaining = remaining;
                this.changed.trigger(this);
            }
            this.progress = Math.round(100 * this.spent / (this.spent + this.remaining));
            this.prediction = Math.round(100 * (this.spent + this.remaining) / this.planned);
            this.calculateProgressPath();
        };
        BudgetItem.prototype.transactionsUpdated = function (new_array, old_array) {
            this.recalculate();
        };
        BudgetItem.prototype.subitemsUpdated = function (new_array, old_array) {
            this.recalculate();
        };
        BudgetItem.prototype.onChildChanged = function (child) {
            this.recalculate();
        };
        return BudgetItem;
    })();
    Budget.BudgetItem = BudgetItem;
})(Budget || (Budget = {}));
/// <reference path="../models/budget-item.ts" />
var Budget;
(function (Budget) {
    var ModelService = (function () {
        function ModelService() {
            console.log("ModelService created");
            this.load();
        }
        ModelService.prototype.getBudget = function () {
            return this.budget;
        };
        ModelService.prototype.getBudgetItem = function (id) {
            return this.getBudgetItemCore(this.budget, id);
        };
        ModelService.prototype.getBudgetItemCore = function (budgetItem, id) {
            if (budgetItem.id == id)
                return budgetItem;
            var foundItem = null;
            for (var idx = 0; idx < budgetItem.subitems.length; idx++) {
                foundItem = this.getBudgetItemCore(budgetItem.subitems[idx], id);
                if (foundItem != null)
                    break;
            }
            return foundItem;
        };
        ModelService.prototype.load = function () {
            this.budget = new Budget.BudgetItem(1, "MyBudget", "", 10000, 1000, 9000, [
                new Budget.BudgetItem(2, "Item1", "", 2000, 1000, 1000, [
                    new Budget.BudgetItem(3, "Item1.1", "", 200, 100, 100),
                    new Budget.BudgetItem(4, "Item1.2", "", 200, 100, 100),
                    new Budget.BudgetItem(5, "Item1.3", "", 200, 100, 100),
                ]),
                new Budget.BudgetItem(6, "Item2", "", 2000, 2200, 200, []),
                new Budget.BudgetItem(7, "Item3", "", 2000, 100, 2000, []),
            ]);
        };
        ModelService.IID = "modelService";
        return ModelService;
    })();
    Budget.ModelService = ModelService;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    var DataService = (function () {
        function DataService($q, $firebaseArray) {
            var _this = this;
            this.$q = $q;
            console.log("Creating data service");
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            var transactionsReference = this._database.child("transactions");
            this._transactions = $firebaseArray(transactionsReference);
            var accountsReference = this._database.child("accounts");
            this._accounts = $firebaseArray(accountsReference);
            $q.all([this._transactions.$loaded(), this._accounts.$loaded()])
                .then(function (result) {
                if (_this._accounts.length == 0) {
                    _this.createDemoData();
                }
            });
        }
        DataService.prototype.transactions = function () {
            return this._transactions;
        };
        DataService.prototype.accounts = function () {
            return this._accounts;
        };
        DataService.prototype.getRootAccountKey = function () {
            return this._accounts[0].$id;
        };
        DataService.prototype.addAccount = function (account) {
            return this._accounts.$add(account);
        };
        DataService.prototype.addTransaction = function (transaction) {
            return this._transactions.$add(transaction);
        };
        DataService.prototype.createDemoData = function () {
            var _this = this;
            this.addAccount({
                subject: 'My budget',
                description: 'This is the root node',
                parent: null
            }).then(function (rootNode) { return _this.$q.all([
                _this.addAccount({
                    subject: 'Item1',
                    description: '',
                    parent: rootNode.key()
                }),
                _this.addAccount({
                    subject: 'Item2',
                    description: '',
                    parent: rootNode.key()
                }),
                _this.addAccount({
                    subject: 'Item3',
                    description: '',
                    parent: rootNode.key()
                })
            ]).then(function (subitems) {
                _this.addTransaction({
                    debit: null,
                    credit: rootNode.key(),
                    amount: 65000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                _this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[0].key(),
                    amount: 25000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                _this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[1].key(),
                    amount: 20000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
                _this.addTransaction({
                    debit: rootNode.key(),
                    credit: subitems[2].key(),
                    amount: 20000,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                });
            }); });
        };
        DataService.IID = "dataService";
        DataService.$inject = [
            '$q',
            '$firebaseArray',
        ];
        return DataService;
    })();
    Budget.DataService = DataService;
})(Budget || (Budget = {}));
/// <reference path="../services/model-service.ts" />
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var BudgetItemCtrl = (function () {
        function BudgetItemCtrl($scope, $stateParams, $location, modelService, dataService) {
            this.$scope = $scope;
            this.$stateParams = $stateParams;
            this.$location = $location;
            this.modelService = modelService;
            this.dataService = dataService;
            this.budgetItem =
                $stateParams.itemid === undefined
                    ? modelService.getBudget()
                    : modelService.getBudgetItem($stateParams.itemid);
            var scopeInject = $scope;
            scopeInject.budgetItem = this.budgetItem;
            console.log("BudgetCtrl created with " + this.budgetItem.subject + " containing " + this.budgetItem.subitems.length + " items.");
        }
        BudgetItemCtrl.$inject = [
            '$scope',
            "$stateParams",
            '$location',
            Budget.ModelService.IID,
            Budget.DataService.IID
        ];
        BudgetItemCtrl.IID = "budgetItemCtrl";
        return BudgetItemCtrl;
    })();
    Budget.BudgetItemCtrl = BudgetItemCtrl;
})(Budget || (Budget = {}));
/// <reference path="../services/model-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var SideMenuCtrl = (function () {
        function SideMenuCtrl($scope, $location, modelService) {
            this.$scope = $scope;
            this.$location = $location;
            this.modelService = modelService;
            console.log("SideMenuCtrl created");
            this.budget = modelService.getBudget();
            $scope.budget = this.budget;
        }
        SideMenuCtrl.$inject = [
            '$scope',
            '$location',
            Budget.ModelService.IID
        ];
        SideMenuCtrl.IID = "sideMenuCtrl";
        return SideMenuCtrl;
    })();
    Budget.SideMenuCtrl = SideMenuCtrl;
})(Budget || (Budget = {}));
/// <reference path="typings/cordova-ionic/plugins/keyboard.d.ts" />
/// <reference path="typings/cordova-ionic/cordova-ionic.d.ts" />
/// <reference path="controllers/budgetctrl.ts" />
/// <reference path="controllers/sidemenuctrl.ts" />
/// <reference path="typings/cordova/cordova.d.ts" />
/// <reference path="services/model-service.ts" />
/// <reference path="services/data-service.ts" />
/// <reference path="typings/angular-ui-router/angular-ui-router.d.ts" />
// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397705
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
var Budget;
(function (Budget) {
    "use strict";
    var budgetModule = angular.module('budget-app', ["ui.router", 'ionic', 'firebase'])
        .controller(Budget.BudgetItemCtrl.IID, Budget.BudgetItemCtrl)
        .controller(Budget.SideMenuCtrl.IID, Budget.SideMenuCtrl)
        .service(Budget.ModelService.IID, Budget.ModelService)
        .service(Budget.DataService.IID, Budget.DataService)
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
        $stateProvider.state("app", {
            url: "/budget/",
            templateUrl: "templates/budget-list.html",
            controller: Budget.BudgetItemCtrl.IID,
        });
        $stateProvider.state("budget-item-detail", {
            url: "/budget-item/:itemid",
            templateUrl: "templates/budget-list.html",
            controller: Budget.BudgetItemCtrl.IID,
        });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/budget/');
        // configure html5 to get links working on jsfiddle
        $locationProvider.html5Mode(true);
    });
    console.log("Module initialized");
    function initialize() {
        document.addEventListener('deviceready', onDeviceReady, false);
    }
    Budget.initialize = initialize;
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
})(Budget || (Budget = {}));
// Platform specific overrides will be placed in the merges folder versions of this file 
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var AccountCtrl = (function () {
        function AccountCtrl($scope, $stateParams, $log, $q, dataService) {
            var _this = this;
            this.$scope = $scope;
            this.$stateParams = $stateParams;
            this.$log = $log;
            this.$q = $q;
            this.dataService = dataService;
            this._accountId = $stateParams.accountId || '';
            var initDeferred = $q.defer();
            this._initDone = initDeferred.promise;
            dataService.accounts().$loaded().then(function (x) {
                if (_this._accountId === '') {
                    _this._accountId = dataService.getRootAccountKey();
                }
                _this.accountReference = dataService.accounts().$getRecord(_this._accountId);
                $scope.account = _this.accountReference.$value;
                initDeferred.resolve(true);
            });
        }
        AccountCtrl.prototype.initDone = function () {
            return this._initDone;
        };
        AccountCtrl.$inject = [
            '$scope',
            "$stateParams",
            "$log",
            "$q",
            Budget.DataService.IID
        ];
        AccountCtrl.IID = "accountCtrl";
        return AccountCtrl;
    })();
    Budget.AccountCtrl = AccountCtrl;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    var UnderscoreService = (function () {
        function UnderscoreService() {
        }
        return UnderscoreService;
    })();
    Budget.UnderscoreService = UnderscoreService;
})(Budget || (Budget = {}));
//# sourceMappingURL=appBundle.js.map