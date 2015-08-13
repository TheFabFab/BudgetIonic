var Budget;
(function (Budget) {
    var Command = (function () {
        function Command(label, link) {
            this.label = label;
            this.link = link;
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
    var AccountAggregate = (function () {
        function AccountAggregate(accountSnapshot, credited, debited, lastAggregationTime) {
            if (credited === void 0) { credited = 0; }
            if (debited === void 0) { debited = 0; }
            if (lastAggregationTime === void 0) { lastAggregationTime = 0; }
            this.accountSnapshot = accountSnapshot;
            this.credited = credited;
            this.debited = debited;
            this.lastAggregationTime = lastAggregationTime;
            if (this.lastAggregationTime == 0) {
                var account = accountSnapshot.val();
                this.credited = account.credited;
                this.debited = account.debited;
                this.lastAggregationTime = account.lastAggregationTime;
            }
        }
        AccountAggregate.prototype.aggregate = function (transaction) {
            var snapshot = this.accountSnapshot;
            var credited = this.credited + (transaction.credit == snapshot.key() ? transaction.amount : 0);
            var debited = this.debited + (transaction.debit == snapshot.key() ? transaction.amount : 0);
            var aggregationTime = (transaction.timestamp > this.lastAggregationTime) ? transaction.timestamp : this.lastAggregationTime;
            return new AccountAggregate(snapshot, credited, debited, aggregationTime);
        };
        return AccountAggregate;
    })();
    ;
    var AggregatorService = (function () {
        function AggregatorService($log, $timeout) {
            this.$log = $log;
            this.$timeout = $timeout;
            this._accountMap = [];
            this._accountsToAggregate = [];
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
        }
        AggregatorService.prototype.start = function () {
            var _this = this;
            this.$log.debug("Starting aggregator service");
            this._accountsReference.on('child_added', function (accountSnapshot) {
                _this.$log.debug("Received account", accountSnapshot.val());
                _this._accountMap[accountSnapshot.key()] = accountSnapshot;
            });
            this._transactionsReference.on('child_added', function (transactionSnapshot) {
                var transaction = transactionSnapshot.val();
                _this.$log.debug("Transaction received", transaction);
                var relatedAccounts = [_this._accountMap[transaction.debit], _this._accountMap[transaction.credit]];
                relatedAccounts
                    .forEach(function (accountSnapshot) {
                    if (accountSnapshot != null) {
                        var account = accountSnapshot.val();
                        if (account.lastAggregationTime < transaction.timestamp) {
                            _this.$log.info("Account " + account.subject + " is not aggregated");
                            var previous = _this._accountsToAggregate[accountSnapshot.key()] ||
                                new AccountAggregate(accountSnapshot);
                            _this._accountsToAggregate[accountSnapshot.key()] = previous.aggregate(transaction);
                            _this.$timeout(function () { return _this.updateAccounts(); });
                        }
                    }
                });
            });
        };
        AggregatorService.prototype.updateAccounts = function () {
            var logged = false;
            for (var property in this._accountsToAggregate) {
                if (this._accountsToAggregate.hasOwnProperty(property)) {
                    if (!logged) {
                        this.$log.debug("Preparing to update accounts:", this._accountsToAggregate);
                        logged = true;
                    }
                    var aggregate = this._accountsToAggregate[property];
                    aggregate.accountSnapshot.ref().update({
                        credited: aggregate.credited,
                        debited: aggregate.debited,
                        lastAggregationTime: aggregate.lastAggregationTime,
                    });
                    delete this._accountsToAggregate[property];
                }
            }
        };
        AggregatorService.IID = "aggregatorService";
        AggregatorService.$inject = [
            "$log",
            '$timeout',
        ];
        return AggregatorService;
    })();
    Budget.AggregatorService = AggregatorService;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    var DataService = (function () {
        function DataService($q, $firebaseArray, aggregatorService) {
            this.$q = $q;
            console.log("Creating data service");
            aggregatorService.start();
            this._database = new Firebase("https://budgetionic.firebaseio.com/");
            this._transactionsReference = this._database.child("transactions");
            this._accountsReference = this._database.child("accounts");
        }
        DataService.prototype.getRootAccountReference = function () {
            return this.getAccountReference('');
        };
        DataService.prototype.getAccountReference = function (key) {
            console.log("Resolving account for key: " + key);
            if (key == 'root') {
                key = '';
            }
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
            this.addAccount('My budget', null, 'This is the root node')
                .then(function (rootNode) { return _this.$q.all([
                _this.addAccount('Item1', rootNode.key()),
                _this.addAccount('Item2', rootNode.key()),
                _this.addAccount('Item3', rootNode.key())
                    .then(function (item3) { return _this.$q.all([
                    _this.addAccount('Item3.1', item3.key()),
                    _this.addAccount('Item3.2', item3.key()),
                    _this.addAccount('Item3.3', item3.key()),
                ]); })
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
            Budget.AggregatorService.IID,
        ];
        return DataService;
    })();
    Budget.DataService = DataService;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    'use strict';
    var NewAccountCtrl = (function () {
        function NewAccountCtrl($stateParams, $scope, $log, dataService) {
            $log.debug("Initializing new account controller", $stateParams);
            this.parentId = $stateParams.parentId || 'root';
        }
        NewAccountCtrl.prototype.add = function () {
            this.subject = '';
            this.description = '';
        };
        NewAccountCtrl.IID = "newAccountCtrl";
        NewAccountCtrl.$inject = [
            '$stateParams',
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
                    scope.accountEx.balance = scope.account.credited - scope.account.debited;
                    scope.accountEx.progress =
                        scope.account.credited
                            ? Math.round(100 * scope.account.debited / scope.account.credited)
                            : 0;
                    scope.accountEx.recalculate();
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
        function AccountCtrl($scope, $firebaseObject, $firebaseArray, $log, dataService, commandService, accountReference) {
            var _this = this;
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.dataService = dataService;
            this.commandService = commandService;
            this.accountReference = accountReference;
            $log.debug("Initializing account controller", arguments);
            $firebaseObject(accountReference).$bindTo($scope, "accountData")
                .then(function (x) { return _this.activate(); });
            var accounts = new Firebase("https://budgetionic.firebaseio.com/accounts");
            var childrenQuery = accounts
                .orderByChild("parent")
                .equalTo(accountReference.key());
            $scope.subAccounts = $firebaseArray(childrenQuery);
            var transactions = new Firebase("https://budgetionic.firebaseio.com/transactions");
            var creditTransactionQuery = transactions
                .orderByChild("credit")
                .equalTo(accountReference.key());
            $scope.creditTransactions = $firebaseArray(creditTransactionQuery);
            var debitTransactionQuery = transactions
                .orderByChild("debit")
                .equalTo(accountReference.key());
            $scope.debitTransactions = $firebaseArray(debitTransactionQuery);
        }
        AccountCtrl.resolve = function () {
            return {
                accountReference: ['$stateParams', Budget.DataService.IID, AccountCtrl.getAccount],
            };
        };
        AccountCtrl.getAccount = function ($stateParams, dataService) {
            console.log("Getting account: ");
            console.log($stateParams);
            var accountId = $stateParams.accountId || '';
            return dataService.getAccountReference(accountId);
        };
        AccountCtrl.prototype.activate = function () {
            this.commandService.registerContextCommands([
                new Budget.Command("Add subaccount to " + this.$scope.accountData.subject, "/#/budget/new/" + this.accountReference.key())
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
            "accountReference",
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
        function MainCtrl($scope, $firebaseObject, $log, dataService, commandService, rootAccountReference) {
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$log = $log;
            this.dataService = dataService;
            this.commandService = commandService;
            this.rootAccountReference = rootAccountReference;
            console.log("Initializing main controller");
            $firebaseObject(rootAccountReference).$bindTo($scope, "rootAccount");
            $scope.contextCommands = commandService.contextCommands;
        }
        MainCtrl.resolve = function () {
            return {
                rootAccountReference: [Budget.DataService.IID, MainCtrl.getAccount],
            };
        };
        MainCtrl.getAccount = function (dataService) {
            return dataService.getRootAccountReference();
        };
        MainCtrl.$inject = [
            '$scope',
            "$firebaseObject",
            "$log",
            Budget.DataService.IID,
            Budget.CommandService.IID,
            'rootAccountReference',
        ];
        MainCtrl.IID = "mainCtrl";
        return MainCtrl;
    })();
    Budget.MainCtrl = MainCtrl;
})(Budget || (Budget = {}));
/// <reference path="services/command-service.ts" />
/// <reference path="services/aggregator-service.ts" />
/// <reference path="services/data-service.ts" />
/// <reference path="controllers/new-account-ctrl.ts" />
/// <reference path="directives/account-overview.ts" />
/// <reference path="typings/cordova-ionic/plugins/keyboard.d.ts" />
/// <reference path="typings/cordova-ionic/cordova-ionic.d.ts" />
/// <reference path="typings/cordova/cordova.d.ts" />
/// <reference path="controllers/account-ctrl.ts" />
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
        .service(Budget.AggregatorService.IID, Budget.AggregatorService)
        .service(Budget.DataService.IID, Budget.DataService)
        .service(Budget.CommandService.IID, Budget.CommandService)
        .directive(Budget.AccountOverview.IID, Budget.AccountOverview.factory())
        .controller(Budget.MainCtrl.IID, Budget.MainCtrl)
        .controller(Budget.AccountCtrl.IID, Budget.AccountCtrl)
        .controller(Budget.NewAccountCtrl.IID, Budget.NewAccountCtrl);
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