var Budget;
(function (Budget) {
    var Command = (function () {
        function Command(label, link, isEnabled) {
            if (isEnabled === void 0) { isEnabled = true; }
            this.label = label;
            this.link = link;
            this.isEnabled = isEnabled;
        }
        return Command;
    })();
    Budget.Command = Command;
})(Budget || (Budget = {}));
/// <reference path="../models/command.ts" />
var Budget;
(function (Budget) {
    var CommandService = (function () {
        function CommandService() {
            this.contextCommands = [];
        }
        CommandService.prototype.registerContextCommands = function (commands) {
            var _this = this;
            this.contextCommands.length = 0;
            commands.forEach(function (c) {
                _this.contextCommands.push(c);
            });
        };
        CommandService.IID = "commandService";
        return CommandService;
    })();
    Budget.CommandService = CommandService;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    var FirebaseEvents = (function () {
        function FirebaseEvents() {
        }
        FirebaseEvents.value = 'value';
        FirebaseEvents.child_added = 'child_added';
        FirebaseEvents.child_changed = 'child_changed';
        FirebaseEvents.child_removed = 'child_removed';
        FirebaseEvents.child_moved = 'child_moved';
        return FirebaseEvents;
    })();
    Budget.FirebaseEvents = FirebaseEvents;
})(Budget || (Budget = {}));
/// <reference path="../constants.ts" />
/// <reference path="../models/server-interfaces.ts" />
var Budget;
(function (Budget) {
    var AccountData = (function () {
        function AccountData(subject, description, parent, debited, credited, lastAggregationTime, key) {
            this.subject = subject;
            this.description = description;
            this.parent = parent;
            this.debited = debited;
            this.credited = credited;
            this.lastAggregationTime = lastAggregationTime;
            this.key = key;
        }
        AccountData.copy = function (other, key) {
            return new AccountData(other.subject, other.description, other.parent, other.debited, other.credited, other.lastAggregationTime, key);
        };
        return AccountData;
    })();
    Budget.AccountData = AccountData;
    var DataService = (function () {
        function DataService($q, $firebaseArray) {
            this.$q = $q;
            console.log("Creating data service");
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
            this.ensureData();
        }
        DataService.prototype.ensureData = function () {
            var _this = this;
            this._accountsReference
                .orderByChild("parent")
                .limitToFirst(1)
                .once(Budget.FirebaseEvents.value, function (snapshot) {
                if (!snapshot.val()) {
                    _this.createDemoData();
                }
            });
        };
        DataService.prototype.getRootAccountSnapshot = function () {
            return this.getAccountSnapshot('');
        };
        DataService.prototype.getAccountSnapshot = function (key) {
            console.log("Resolving account for key: " + key);
            if (key == 'root') {
                key = '';
            }
            var deferred = this.$q.defer();
            if (key === '') {
                var query = this._accountsReference
                    .orderByChild("parent")
                    .equalTo('');
                query.once(Budget.FirebaseEvents.value, function (snapshot) {
                    var child;
                    snapshot.forEach(function (x) { return child = x; });
                    if (child) {
                        deferred.resolve(child);
                    }
                    else {
                        deferred.reject();
                    }
                });
            }
            else {
                console.log("Resolving account by key " + key);
                this._accountsReference.child(key).once(Budget.FirebaseEvents.value, function (snapshot) {
                    console.log("Resolved account by id:");
                    console.log(snapshot);
                    deferred.resolve(snapshot);
                });
            }
            return deferred.promise;
        };
        DataService.prototype.addChildAccount = function (parentKey, subject, description) {
            var _this = this;
            var deferred = this.$q.defer();
            this.normalizeAccountKey(parentKey)
                .then(function (key) {
                _this._accountsReference.push({
                    subject: subject,
                    description: description,
                    parent: key,
                    debited: 0,
                    credited: 0,
                    lastAggregationTime: 0,
                }, function (error) {
                    if (error == null)
                        deferred.resolve();
                    else
                        deferred.reject(error);
                });
            });
            return deferred.promise;
        };
        DataService.prototype.deleteAccount = function (accountId) {
            var deferred = this.$q.defer();
            this.getAccountSnapshot(accountId)
                .then(function (accountReference) {
                accountReference.ref().remove(function (error) {
                    if (error)
                        deferred.reject(error);
                    else
                        deferred.resolve();
                });
            });
            return deferred.promise;
        };
        DataService.prototype.normalizeAccountKey = function (accountKey) {
            var accountKeyDeferred = this.$q.defer();
            if (accountKey == 'root') {
                accountKey = '';
            }
            if (accountKey == '') {
                this.getRootAccountSnapshot().then(function (x) { return accountKeyDeferred.resolve(x.key()); });
            }
            else {
                accountKeyDeferred.resolve(accountKey);
            }
            return accountKeyDeferred.promise;
        };
        DataService.prototype.addAccount = function (subject, parent, description) {
            if (parent === void 0) { parent = null; }
            if (description === void 0) { description = ''; }
            var deferred = this.$q.defer();
            var reference = this._accountsReference.push({
                subject: subject,
                description: description,
                parent: parent,
                credited: 0,
                debited: 0,
                lastAggregationTime: 0,
            }, function (x) {
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
        DataService.prototype.createDemoData = function () {
            var _this = this;
            var deferred = this.$q.defer();
            console.log("Creating demo data...");
            this.addAccount('My budget', '', 'This is the root node')
                .then(function (rootNode) { return _this.$q.all([
                _this.addAccount('Item1', rootNode.key()),
                _this.addAccount('Item2', rootNode.key()),
                _this.addAccount('Item3', rootNode.key())
                    .then(function (item3) {
                    _this.$q.all([
                        _this.addAccount('Item3.1', item3.key()),
                        _this.addAccount('Item3.2', item3.key()),
                        _this.addAccount('Item3.3', item3.key()),
                    ]);
                    return item3;
                })
            ])
                .then(function (subitems) {
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
                        amount: 10000,
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
var Budget;
(function (Budget) {
    'use strict';
    var NewAccountCtrl = (function () {
        function NewAccountCtrl($stateParams, $ionicHistory, $scope, $log, dataService) {
            this.$ionicHistory = $ionicHistory;
            this.dataService = dataService;
            this.subject = '';
            this.description = '';
            $log.debug("Initializing new account controller", $stateParams);
            this.parentId = $stateParams.parentId || 'root';
        }
        NewAccountCtrl.prototype.ok = function () {
            var _this = this;
            this.dataService.addChildAccount(this.parentId, this.subject, this.description)
                .then(function (x) { return _this.$ionicHistory.goBack(); });
        };
        NewAccountCtrl.prototype.cancel = function () {
            this.$ionicHistory.goBack();
        };
        NewAccountCtrl.IID = "newAccountCtrl";
        NewAccountCtrl.$inject = [
            '$stateParams',
            '$ionicHistory',
            "$scope",
            "$log",
            Budget.DataService.IID,
        ];
        return NewAccountCtrl;
    })();
    Budget.NewAccountCtrl = NewAccountCtrl;
})(Budget || (Budget = {}));
/// <reference path="../typings/angularjs/angular.d.ts" />
var Budget;
(function (Budget) {
    var AccountEx = (function () {
        function AccountEx() {
        }
        AccountEx.prototype.recalculate = function () {
            var progress = this.progress || 0;
            this.warning = progress > 90;
            this.error = progress > 100;
            var alpha = 2 * Math.PI * progress / 100;
            var x = 40 + 35 * Math.sin(alpha);
            var y = 40 - 35 * Math.cos(alpha);
            var largeArcFlag = progress > 50 ? 1 : 0;
            this.progressPath = 'M40,5 A35,35 0 ' + largeArcFlag + ',1 ' + x + ',' + y;
            this.xArcEnd = x;
            this.yArcEnd = y;
        };
        return AccountEx;
    })();
    var AccountOverview = (function () {
        function AccountOverview($log) {
            this.$log = $log;
            this.restrict = 'E';
            this.replace = false;
            this.templateUrl = '/templates/account-overview.html';
            this.scope = {
                account: '=',
                showLabels: '=',
            };
            this.link = function (scope, elements) {
                scope.accountEx = new AccountEx();
                scope.$watch('account', function () {
                    if (scope.account) {
                        scope.accountEx.balance = scope.account.credited - scope.account.debited;
                        scope.accountEx.progress =
                            scope.account.credited
                                ? Math.round(100 * scope.account.debited / scope.account.credited)
                                : 0;
                        scope.accountEx.recalculate();
                    }
                });
            };
            $log.debug("Constructing account overview");
        }
        AccountOverview.factory = function () {
            var directive = function ($log) { return new AccountOverview($log); };
            directive.$inject = ['$log'];
            return directive;
        };
        AccountOverview.IID = "accountOverview";
        return AccountOverview;
    })();
    Budget.AccountOverview = AccountOverview;
})(Budget || (Budget = {}));
/// <reference path="../services/command-service.ts" />
/// <reference path="../typings/extensions.d.ts" />
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var AccountCtrl = (function () {
        function AccountCtrl($scope, $firebaseObject, $firebaseArray, $log, dataService, commandService, accountSnapshot) {
            var _this = this;
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.dataService = dataService;
            this.commandService = commandService;
            this.accountSnapshot = accountSnapshot;
            $log.debug("Initializing account controller", arguments);
            var accountData = accountSnapshot.exportVal();
            this.addSubaccountCommand = new Budget.Command("Add subaccount to " + accountData.subject, "/#/budget/new/" + this.accountSnapshot.key());
            this.deleteCommand = new Budget.Command("Delete account", "/#/budget/delete/" + this.accountSnapshot.key(), false);
            this.allocateBudgetCommand = new Budget.Command("Allocate budget", "/#/budget/allocate/" + this.accountSnapshot.key());
            $firebaseObject(accountSnapshot.ref()).$bindTo($scope, "accountData");
            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");
            var childrenQuery = accounts
                .orderByChild("parent")
                .equalTo(accountSnapshot.key());
            $scope.subAccounts = $firebaseArray(childrenQuery);
            var transactions = new Firebase("https://budgetionic.firebaseio.com/transactions");
            var creditTransactionQuery = transactions
                .orderByChild("credit")
                .equalTo(accountSnapshot.key());
            $scope.creditTransactions = $firebaseArray(creditTransactionQuery);
            var debitTransactionQuery = transactions
                .orderByChild("debit")
                .equalTo(accountSnapshot.key());
            $scope.debitTransactions = $firebaseArray(debitTransactionQuery);
            $scope.$on('$ionicView.enter', function () {
                $log.debug("Entering account controller", _this.$scope);
                _this.updateContextCommands();
                _this.setContextCommands();
            });
            $scope.subAccounts.$watch(function (event, key, prevChild) { return _this.updateContextCommands(); });
            $scope.creditTransactions.$watch(function (event, key, prevChild) { return _this.updateContextCommands(); });
            $scope.debitTransactions.$watch(function (event, key, prevChild) { return _this.updateContextCommands(); });
        }
        AccountCtrl.resolve = function () {
            return {
                accountSnapshot: ['$stateParams', Budget.DataService.IID, AccountCtrl.getAccount],
            };
        };
        AccountCtrl.getAccount = function ($stateParams, dataService) {
            console.log("Getting account: ");
            console.log($stateParams);
            var accountId = $stateParams.accountId || '';
            return dataService.getAccountSnapshot(accountId);
        };
        AccountCtrl.prototype.updateContextCommands = function () {
            var hasData = this.$scope.subAccounts.length == 0 &&
                this.$scope.creditTransactions.length == 0 &&
                this.$scope.debitTransactions.length == 0;
            if (this.deleteCommand != null) {
                this.deleteCommand.isEnabled = hasData;
            }
        };
        AccountCtrl.prototype.setContextCommands = function () {
            this.commandService.registerContextCommands([
                this.allocateBudgetCommand,
                this.addSubaccountCommand,
                this.deleteCommand,
            ]);
        };
        AccountCtrl.IID = "accountCtrl";
        AccountCtrl.$inject = [
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            Budget.DataService.IID,
            Budget.CommandService.IID,
            "accountSnapshot",
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
        function MainCtrl($scope, $firebaseObject, $log, dataService, commandService, rootAccount) {
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$log = $log;
            this.dataService = dataService;
            this.commandService = commandService;
            this.rootAccount = rootAccount;
            console.log("Initializing main controller");
            $firebaseObject(rootAccount.ref()).$bindTo($scope, "rootAccount");
            $scope.contextCommands = commandService.contextCommands;
        }
        MainCtrl.resolve = function () {
            return {
                rootAccount: [Budget.DataService.IID, MainCtrl.getAccount],
            };
        };
        MainCtrl.getAccount = function (dataService) {
            return dataService.getRootAccountSnapshot();
        };
        MainCtrl.$inject = [
            '$scope',
            "$firebaseObject",
            "$log",
            Budget.DataService.IID,
            Budget.CommandService.IID,
            'rootAccount',
        ];
        MainCtrl.IID = "mainCtrl";
        return MainCtrl;
    })();
    Budget.MainCtrl = MainCtrl;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    'use strict';
    var DeleteAccountCtrl = (function () {
        function DeleteAccountCtrl($stateParams, $state, $ionicHistory, $log, dataService) {
            var _this = this;
            this.$state = $state;
            this.$ionicHistory = $ionicHistory;
            this.dataService = dataService;
            $log.debug("Initializing delete account controller", $stateParams);
            this.accountId = $stateParams.accountId || 'root';
            this.dataService.getAccountSnapshot(this.accountId)
                .then(function (snapshot) {
                _this.account = snapshot.exportVal();
            });
        }
        DeleteAccountCtrl.prototype.ok = function () {
            var _this = this;
            this.dataService.deleteAccount(this.accountId)
                .then(function (x) { return _this.$state.go("app.budget-account", { accountId: _this.account.parent }); });
        };
        DeleteAccountCtrl.prototype.cancel = function () {
            this.$ionicHistory.goBack();
        };
        DeleteAccountCtrl.IID = "deleteAccountCtrl";
        DeleteAccountCtrl.$inject = [
            '$stateParams',
            '$state',
            '$ionicHistory',
            '$log',
            Budget.DataService.IID
        ];
        return DeleteAccountCtrl;
    })();
    Budget.DeleteAccountCtrl = DeleteAccountCtrl;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    'use strict';
    var AllocateBudgetCtrl = (function () {
        function AllocateBudgetCtrl($stateParams, $scope, $firebaseObject, $firebaseArray, $log, $ionicHistory, $q, dataService) {
            var _this = this;
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.$ionicHistory = $ionicHistory;
            this.$q = $q;
            this.dataService = dataService;
            this.amount = 0;
            $log.debug("Initializing allocate controller", arguments);
            this.creditAccountId = $stateParams.accountId || 'root';
            this.dataService.getAccountSnapshot(this.creditAccountId)
                .then(function (snapshot) {
                _this.creditAccount = snapshot.exportVal();
            })
                .then(function (x) {
                _this.getAncestors().then(function (ancestors) { return _this.ancestors = ancestors; });
            });
        }
        AllocateBudgetCtrl.prototype.ok = function () {
            var _this = this;
            if (this.debitAccount) {
                var promises = [];
                var balance = this.debitAccount.credited - this.debitAccount.debited;
                if (this.amount < this.amount) {
                    /// TODO: Error handling
                    if (this.debitAccount.parent == null) {
                    }
                    else {
                    }
                }
                else {
                    // Bubble up the amount to the requested account
                    var previousAccount = null;
                    // make a copy
                    var accounts = this.ancestors.slice(0);
                    // add the credit account itself
                    accounts.push(Budget.AccountData.copy(this.creditAccount, this.creditAccountId));
                    // remove up to (including) the debit account
                    while (previousAccount == null || previousAccount.key != this.debitAccount.key) {
                        previousAccount = accounts.shift();
                    }
                    // do the credit bubbling
                    accounts.forEach(function (account) {
                        var debitAccount = previousAccount;
                        var creditAccount = account;
                        var promise = _this.dataService.addTransaction({
                            amount: _this.amount,
                            debit: debitAccount.key,
                            credit: creditAccount.key,
                            timestamp: Firebase.ServerValue.TIMESTAMP
                        });
                        promises.push(promise);
                        previousAccount = account;
                    });
                    // wait for all to get saved, then return
                    this.$q.all(promises)
                        .then(function (x) { return _this.$ionicHistory.goBack(); });
                }
            }
        };
        AllocateBudgetCtrl.prototype.cancel = function () {
            this.$ionicHistory.goBack();
        };
        AllocateBudgetCtrl.prototype.getAncestors = function (account) {
            var _this = this;
            if (account === void 0) { account = null; }
            if (!account)
                account = this.creditAccount;
            var deferred = this.$q.defer();
            if (account.parent) {
                this.dataService.getAccountSnapshot(account.parent)
                    .then(function (parentSnapshot) {
                    if (parentSnapshot) {
                        var parent = Budget.AccountData.copy(parentSnapshot.exportVal(), parentSnapshot.key());
                        _this.$log.debug("Ancestor:", parent);
                        _this.getAncestors(parent)
                            .then(function (parentAncestors) {
                            parentAncestors.push(parent);
                            deferred.resolve(parentAncestors);
                        });
                    }
                    else {
                        deferred.resolve([]);
                    }
                });
            }
            else {
                deferred.resolve([]);
            }
            return deferred.promise;
        };
        AllocateBudgetCtrl.IID = "allocateBudgetCtrl";
        AllocateBudgetCtrl.$inject = [
            '$stateParams',
            '$scope',
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            "$ionicHistory",
            "$q",
            Budget.DataService.IID,
        ];
        return AllocateBudgetCtrl;
    })();
    Budget.AllocateBudgetCtrl = AllocateBudgetCtrl;
})(Budget || (Budget = {}));
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
// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397705
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
var Budget;
(function (Budget) {
    "use strict";
    var budgetModule = angular.module('budget-app', ['ionic', 'firebase'])
        .service(Budget.DataService.IID, Budget.DataService)
        .service(Budget.CommandService.IID, Budget.CommandService)
        .directive(Budget.AccountOverview.IID, Budget.AccountOverview.factory())
        .controller(Budget.MainCtrl.IID, Budget.MainCtrl)
        .controller(Budget.AccountCtrl.IID, Budget.AccountCtrl)
        .controller(Budget.NewAccountCtrl.IID, Budget.NewAccountCtrl)
        .controller(Budget.DeleteAccountCtrl.IID, Budget.DeleteAccountCtrl)
        .controller(Budget.AllocateBudgetCtrl.IID, Budget.AllocateBudgetCtrl);
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
            resolve: Budget.MainCtrl.resolve()
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
        $stateProvider.state("app.new-account", {
            url: "/new/:parentId",
            views: {
                'main-content': {
                    templateUrl: "templates/new-account.html",
                },
            },
        });
        $stateProvider.state("app.delete-account", {
            url: "/delete/:accountId",
            views: {
                'main-content': {
                    templateUrl: "templates/delete-account.html",
                },
            },
        });
        $stateProvider.state("app.allocate", {
            url: "/allocate/:accountId",
            views: {
                'main-content': {
                    templateUrl: "templates/allocate.html",
                },
            },
        });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/budget/account/root');
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