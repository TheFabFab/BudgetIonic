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
/// <reference path="../typings/firebase/firebase.d.ts" />
/// <reference path="lite-events.ts" />
/// <reference path="../typings/angularfire/angularfire.d.ts" />
var Budget;
(function (Budget) {
    var Account = (function () {
        function Account(_dataService, _firebaseObject, _snapshot, subAccounts, creditTransactions, debitTransactions) {
            var _this = this;
            this._firebaseObject = _firebaseObject;
            this._snapshot = _snapshot;
            this.subAccounts = subAccounts;
            this.debited = 0;
            this.credited = 0;
            this._key = _snapshot.key();
            creditTransactions.forEach(function (x) { return _this.credited += x.amount; });
            debitTransactions.forEach(function (x) { return _this.debited += x.amount; });
            this._firebaseObject.on('value', function (snapshot) { return _this._snapshot = snapshot; });
            _dataService.newTransactionAvailable().on(function (transaction) { return _this.onNewTransactionAvailable(transaction); });
        }
        Account.prototype.key = function () {
            return this._key;
        };
        Account.prototype.firebaseObject = function () {
            return this._firebaseObject;
        };
        Account.prototype.snapshot = function () {
            return this._snapshot;
        };
        Account.prototype.onNewTransactionAvailable = function (transaction) {
            if (transaction.debit == this._key) {
                this.debited += transaction.amount;
            }
            if (transaction.credit == this._key) {
                this.credited += transaction.amount;
            }
        };
        return Account;
    })();
    Budget.Account = Account;
})(Budget || (Budget = {}));
/// <reference path="../models/account.ts" />
/// <reference path="../models/lite-events.ts" />
var Budget;
(function (Budget) {
    var DataService = (function () {
        function DataService($q, $firebaseArray) {
            var _this = this;
            this.$q = $q;
            this._accountMap = [];
            this._newTransactionAvailable = new Budget.LiteEvent();
            console.log("Creating data service");
            var loadedPromise = $q.defer();
            this._loaded = loadedPromise.promise;
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
            this._transactionsReference.on('child_added', function (dataSnapshot, prevChildName) {
                _this.onTransactionAdded(dataSnapshot, prevChildName);
            });
            this.loadAccounts()
                .then(function (rootAccount) {
                if (rootAccount == null) {
                    _this.createDemoData()
                        .then(function () {
                        _this.loadAccounts().then(function (rootAccount2) {
                            console.assert(rootAccount2 != null, "We should have a root account after creating demo data");
                            _this._rootAccount = rootAccount;
                            loadedPromise.resolve(true);
                        });
                    });
                }
                else {
                    loadedPromise.resolve(true);
                    _this._rootAccount = rootAccount;
                }
            });
        }
        DataService.prototype.getAccountReference = function (key) {
            console.log("Resolving account for key: " + key);
            var deferred = this.$q.defer();
            if (key === '') {
                var query = this._accountsReference
                    .orderByChild("parent")
                    .equalTo(null);
                query.once('value', function (snapshot) {
                    var child;
                    snapshot.forEach(function (x) { return child = x; });
                    deferred.resolve(child.ref());
                });
            }
            else {
                console.log("Resolving account by key " + key);
                this._accountsReference.child(key).once('value', function (snapshot) {
                    console.log("Resolved account by id:");
                    console.log(snapshot);
                    deferred.resolve(snapshot.ref());
                });
            }
            return deferred.promise;
        };
        DataService.prototype.loaded = function () {
            return this._loaded;
        };
        DataService.prototype.getRootAccount = function () {
            this.assertLoaded();
            return this._rootAccount;
        };
        DataService.prototype.getAccount = function (key) {
            this.assertLoaded();
            return this._accountMap[key];
        };
        DataService.prototype.newTransactionAvailable = function () {
            return this._newTransactionAvailable;
        };
        DataService.prototype.onTransactionAdded = function (dataSnapshot, prevChildName) {
            var transaction = dataSnapshot.val();
            this._newTransactionAvailable.trigger(transaction);
        };
        DataService.prototype.filterTransactions = function (creditOrDebit, accountKey) {
            var deferred = this.$q.defer();
            this._transactionsReference
                .orderByChild(creditOrDebit ? "credit" : "debit")
                .equalTo(accountKey)
                .once('value', function (snapshot) {
                var transactions = [];
                snapshot.forEach(function (x) { return transactions.push(x.val()); });
                deferred.resolve(transactions);
            });
            return deferred.promise;
        };
        DataService.prototype.transactionsReference = function () {
            return this._transactionsReference;
        };
        DataService.prototype.assertLoaded = function () {
            console.assert(this._loaded["$$state"] !== undefined, "$q internals changed");
            console.assert(this._loaded["$$state"].value !== undefined, "Controller should be only invoked after data is loaded.");
            console.assert(this._loaded["$$state"].value == true, "Controller should be only invoked if data is loaded successfully.");
        };
        DataService.prototype.addAccount = function (account) {
            var deferred = this.$q.defer();
            var reference = this._accountsReference.push(account, function (x) {
                deferred.resolve(reference);
            });
            return deferred.promise;
        };
        DataService.prototype.addTransaction = function (transaction) {
            var deferred = this.$q.defer();
            var reference = this._transactionsReference.push(transaction, function (x) {
                deferred.resolve(reference);
            });
            return deferred.promise;
        };
        DataService.prototype.loadAccounts = function () {
            var _this = this;
            var rootAccountPromise = this.$q.defer();
            this._accountsReference.orderByChild("parent")
                .equalTo(null)
                .once("value", function (rootCandidates) {
                if (rootCandidates.hasChildren()) {
                    console.assert(rootCandidates.numChildren() == 1, "Exactly one root account is expected");
                    var root;
                    rootCandidates.forEach(function (x) { return root = x; });
                    _this.loadAccount(root).then(function (rootAccount) {
                        rootAccountPromise.resolve(rootAccount);
                    });
                }
                else {
                    rootAccountPromise.resolve(null);
                }
            });
            return rootAccountPromise.promise;
        };
        DataService.prototype.loadAccount = function (snapshot) {
            var _this = this;
            var childrenLoaded = this.$q.defer();
            this._accountsReference
                .orderByChild("parent")
                .equalTo(snapshot.key())
                .once('value', function (childrenSnapshot) {
                var children = [];
                childrenSnapshot.forEach(function (childSnapshot) {
                    children.push(_this.loadAccount(childSnapshot));
                });
                _this.$q.all(children).then(function (childAccounts) { return childrenLoaded.resolve(childAccounts); });
            });
            var creditTransactionsDeferred = this.filterTransactions(true, snapshot.key());
            var debitTransactionsDeferred = this.filterTransactions(false, snapshot.key());
            var loadedAccount = this.$q.all([creditTransactionsDeferred, debitTransactionsDeferred, childrenLoaded.promise])
                .then(function (results) {
                var creditTransactions = results[0];
                var debitTransactions = results[1];
                var childAccounts = results[2];
                var firebaseObject = _this._accountsReference.child(snapshot.key());
                var account = new Budget.Account(_this, firebaseObject, snapshot, childAccounts, creditTransactions, debitTransactions);
                _this._accountMap[snapshot.key()] = account;
                return account;
            });
            return loadedAccount;
        };
        DataService.prototype.createDemoData = function () {
            var _this = this;
            var deferred = this.$q.defer();
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
                _this.$q.all([
                    _this.addTransaction({
                        debit: null,
                        credit: rootNode.key(),
                        amount: 65000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    _this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[0].key(),
                        amount: 25000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    _this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[1].key(),
                        amount: 20000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    _this.addTransaction({
                        debit: rootNode.key(),
                        credit: subitems[2].key(),
                        amount: 20000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    })
                ]).then(function (x) { return deferred.resolve(); });
            }); });
            return deferred.promise;
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
            console.log("Initializing budget controller");
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
/// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var AccountCtrl = (function () {
        function AccountCtrl($scope, $firebaseObject, $firebaseArray, $log, dataService, account) {
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.dataService = dataService;
            this.account = account;
            console.log("Initializing account controller");
            console.log(arguments);
            $firebaseObject(account).$bindTo($scope, "accountData");
            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");
            var childrenQuery = accounts
                .orderByChild("parent")
                .equalTo(account.key());
            console.log(account.key());
            $scope.subAccounts = $firebaseArray(childrenQuery);
            $scope.subAccounts.$loaded(function (x) {
                console.log($scope.subAccounts);
            });
        }
        AccountCtrl.resolve = function () {
            return {
                account: ['$stateParams', Budget.DataService.IID, AccountCtrl.getAccount],
            };
        };
        AccountCtrl.getAccount = function ($stateParams, dataService) {
            console.log("Getting account: ");
            console.log($stateParams);
            var accountId = $stateParams.accountId || '';
            return dataService.getAccountReference(accountId);
        };
        AccountCtrl.IID = "accountCtrl";
        AccountCtrl.$inject = [
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            Budget.DataService.IID,
            "account",
        ];
        return AccountCtrl;
    })();
    Budget.AccountCtrl = AccountCtrl;
})(Budget || (Budget = {}));
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var MainCtrl = (function () {
        function MainCtrl($scope, $firebaseObject, $log, dataService) {
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$log = $log;
            this.dataService = dataService;
            console.log("Initializing main controller");
            this._rootAccount = dataService.getRootAccount();
            $firebaseObject(this._rootAccount.firebaseObject()).$bindTo($scope, "rootAccountData");
            $scope.rootAccount = this._rootAccount;
        }
        MainCtrl.$inject = [
            '$scope',
            "$firebaseObject",
            "$log",
            Budget.DataService.IID
        ];
        MainCtrl.IID = "mainCtrl";
        return MainCtrl;
    })();
    Budget.MainCtrl = MainCtrl;
})(Budget || (Budget = {}));
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
        .service(Budget.DataService.IID, Budget.DataService)
        .service(Budget.ModelService.IID, Budget.ModelService)
        .controller(Budget.BudgetItemCtrl.IID, Budget.BudgetItemCtrl)
        .controller(Budget.SideMenuCtrl.IID, Budget.SideMenuCtrl)
        .controller(Budget.MainCtrl.IID, Budget.MainCtrl)
        .controller(Budget.AccountCtrl.IID, Budget.AccountCtrl);
    budgetModule
        .run(function ($ionicPlatform, $rootScope) {
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
    });
    budgetModule
        .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
        console.log("Configuring routes...");
        $stateProvider
            .state("app", {
            abstract: true,
            url: "/budget",
            views: {
                'main-frame': {
                    controller: Budget.MainCtrl.IID,
                    templateUrl: "templates/master-page.html",
                },
            },
            resolve: {
                delay: ['$q', Budget.DataService.IID, function ($q, dataService) {
                        console.log("Resolving app state...");
                        return dataService.loaded();
                    }]
            }
        })
            .state("app.budget", {
            url: "/home",
            views: {
                'main-content': {
                    templateUrl: "templates/account.html",
                    resolve: Budget.AccountCtrl.resolve(),
                    controller: Budget.AccountCtrl.IID,
                },
            },
        });
        $stateProvider.state("app.budget-account", {
            url: "/account/:accountId",
            views: {
                'main-content': {
                    templateUrl: "templates/account.html",
                    resolve: Budget.AccountCtrl.resolve(),
                    controller: Budget.AccountCtrl.IID,
                },
            },
        });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/budget/home');
        // configure html5 to get links working on jsfiddle
        $locationProvider.html5Mode(false);
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