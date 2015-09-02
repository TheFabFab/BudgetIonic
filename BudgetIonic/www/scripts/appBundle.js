var Budget;
(function (Budget) {
    var ProjectNode = (function () {
        function ProjectNode(transactions, accounts, users) {
            this.transactions = transactions;
            this.accounts = accounts;
            this.users = users;
        }
        return ProjectNode;
    })();
    Budget.ProjectNode = ProjectNode;
    var ProjectHeader = (function () {
        function ProjectHeader(title, rootAccount) {
            this.title = title;
            this.rootAccount = rootAccount;
        }
        return ProjectHeader;
    })();
    Budget.ProjectHeader = ProjectHeader;
    var ProjectUserData = (function () {
        function ProjectUserData(lastAccessTime) {
            this.lastAccessTime = lastAccessTime;
        }
        return ProjectUserData;
    })();
    Budget.ProjectUserData = ProjectUserData;
    var ProjectOfUser = (function () {
        function ProjectOfUser(title, lastAccessTime, key) {
            this.title = title;
            this.lastAccessTime = lastAccessTime;
            this.key = key;
        }
        return ProjectOfUser;
    })();
    Budget.ProjectOfUser = ProjectOfUser;
    var DataWithKey = (function () {
        function DataWithKey(key, data) {
            this.key = key;
            this.data = data;
        }
        DataWithKey.fromSnapshot = function (snapshot) {
            return new DataWithKey(snapshot.key(), snapshot.exportVal());
        };
        return DataWithKey;
    })();
    Budget.DataWithKey = DataWithKey;
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
        AccountData.fromIAccountData = function (other, key) {
            return new AccountData(other.subject, other.description, other.parent, other.debited, other.credited, other.lastAggregationTime, key);
        };
        AccountData.fromSnapshot = function (snapshot) {
            return AccountData.fromIAccountData(snapshot.exportVal(), snapshot.key());
        };
        return AccountData;
    })();
    Budget.AccountData = AccountData;
})(Budget || (Budget = {}));
/// <reference path="../models/project-data.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../models/server-interfaces.ts" />
/// <reference path="../models/account-data.ts" />
var Budget;
(function (Budget) {
    var DataService = (function () {
        function DataService($q, $log) {
            this.$q = $q;
            this.$log = $log;
            $log.debug("Creating data service");
            this.database = new Firebase("https://budgetionic.firebaseio.com/");
            this.usersReference = this.database.child("users");
            this.projectsReference = this.database.child("projects");
            this.projectHeadersReference = this.database.child("project-headers");
        }
        DataService.prototype.getDatabaseReference = function () {
            return this.database;
        };
        DataService.prototype.getUsersReference = function () {
            return this.usersReference;
        };
        DataService.prototype.getProjectsReference = function () {
            return this.projectsReference;
        };
        DataService.prototype.getRootAccountSnapshot = function (projectKey) {
            return this.getAccountSnapshot(projectKey, "");
        };
        DataService.prototype.getAccountSnapshot = function (projectKey, accountKey) {
            var _this = this;
            this.$log.debug("Resolving account", projectKey, accountKey);
            var deferred = this.$q.defer();
            this.projectsReference
                .child(projectKey)
                .child("accounts")
                .child(accountKey)
                .once(Budget.FirebaseEvents.value, function (snapshot) {
                _this.$log.debug("Resolved account by project and id", snapshot.exportVal());
                deferred.resolve(snapshot);
            });
            return deferred.promise;
        };
        DataService.prototype.addChildAccount = function (projectKey, parentKey, subject, description) {
            var deferred = this.$q.defer();
            this.projectsReference
                .child(projectKey)
                .child("accounts")
                .push({
                subject: subject,
                description: description,
                parent: parentKey,
                debited: 0,
                credited: 0,
                lastAggregationTime: 0
            }, function (error) {
                if (error == null)
                    deferred.resolve();
                else
                    deferred.reject(error);
            });
            return deferred.promise;
        };
        DataService.prototype.deleteAccount = function (projectKey, accountId) {
            var deferred = this.$q.defer();
            this.getAccountSnapshot(projectKey, accountId)
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
        DataService.prototype.addTransaction = function (projectKey, transaction) {
            var deferred = this.$q.defer();
            var reference = this.projectsReference
                .child(projectKey)
                .child("transactions")
                .push(transaction, function (x) {
                deferred.resolve(reference);
            });
            return deferred.promise;
        };
        DataService.prototype.getProjectsForUser = function (userId) {
            var _this = this;
            var deferred = this.$q.defer();
            this.usersReference
                .child(userId)
                .child("projects")
                .once(Budget.FirebaseEvents.value, function (userProjectIds) {
                var projectIds = [];
                userProjectIds.forEach(function (snapshot) {
                    projectIds.push({
                        projectId: snapshot.key(),
                        lastAccessTime: snapshot.exportVal().lastAccessTime
                    });
                });
                projectIds.sort(function (a, b) { return a.lastAccessTime - b.lastAccessTime; });
                var projectsPromise = projectIds.map(function (x) {
                    var projectDeferred = _this.$q.defer();
                    var projectDataReference = _this.projectHeadersReference.child(x.projectId);
                    projectDataReference.once(Budget.FirebaseEvents.value, function (projectSnapshot) {
                        var projectData = projectSnapshot.exportVal();
                        projectDeferred.resolve(new Budget.ProjectOfUser(projectData.title, x.lastAccessTime, x.projectId));
                    });
                    return projectDeferred.promise;
                });
                _this.$q.all(projectsPromise).then(function (x) { return deferred.resolve(x); });
            });
            return deferred.promise;
        };
        DataService.prototype.addNewProject = function (userId, projectTitle) {
            var _this = this;
            var deferred = this.$q.defer();
            var projectNode = {
                accounts: {},
                transactions: {},
                users: {}
            };
            projectNode.users[userId] = true;
            var projectReference = this.projectsReference.push(projectNode, function (error) {
                var rootAccount = projectReference
                    .child("accounts").push({
                    subject: projectTitle,
                    debited: 0,
                    credited: 0,
                    parent: "",
                    description: "",
                    lastAggregationTime: 0
                }, function (error) {
                    _this.projectHeadersReference
                        .child(projectReference.key())
                        .set({
                        title: projectTitle,
                        rootAccount: rootAccount.key()
                    }, function (error) {
                        var userProjectUpdate = {};
                        userProjectUpdate[projectReference.key()] = {
                            lastAccessTime: Firebase.ServerValue.TIMESTAMP
                        };
                        _this.usersReference
                            .child(userId)
                            .child("projects")
                            .update(userProjectUpdate, function (error) {
                            deferred.resolve({
                                lastAccessTime: 0,
                                key: projectReference.key(),
                                title: projectTitle
                            });
                        });
                    });
                });
            });
            return deferred.promise;
        };
        DataService.prototype.getProjectHeader = function (projectId) {
            var _this = this;
            var deferred = this.$q.defer();
            this.projectHeadersReference
                .child(projectId)
                .once(Budget.FirebaseEvents.value, function (snapShot) {
                _this.$log.debug("Found project data", snapShot.exportVal());
                deferred.resolve(Budget.DataWithKey.fromSnapshot(snapShot));
            });
            return deferred.promise;
        };
        DataService.prototype.addAccount = function (projectKey, subject, parent, description) {
            if (parent === void 0) { parent = null; }
            if (description === void 0) { description = ""; }
            var deferred = this.$q.defer();
            var reference = this.projectsReference
                .child(projectKey)
                .child("accounts")
                .push({
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
        DataService.IID = "dataService";
        DataService.$inject = [
            "$q",
            "$log"
        ];
        return DataService;
    })();
    Budget.DataService = DataService;
})(Budget || (Budget = {}));
/// <reference path="data-service.ts" />
var Budget;
(function (Budget) {
    var AuthenticationService = (function () {
        function AuthenticationService($q, $log, $http, dataService) {
            var _this = this;
            this.$q = $q;
            this.$log = $log;
            this.$http = $http;
            this.dataService = dataService;
            $log.debug("Creating authentication service");
            this.database = dataService.getDatabaseReference();
            this.usersReference = dataService.getUsersReference();
            this.initializedDeferred = $q.defer();
            this.initialized = this.initializedDeferred.promise;
            this.database.onAuth(function (authData) { return _this.onAuthenticationChanged(authData); });
        }
        AuthenticationService.prototype.facebookLogin = function () {
            var _this = this;
            var deferred = this.$q.defer();
            this.database.authWithOAuthPopup("facebook", function (error, authData) {
                if (error) {
                    console.log("Login Failed!", error);
                    deferred.reject(error);
                }
                else {
                    _this.getUserData(authData)
                        .then(function (userData) {
                        deferred.resolve(userData);
                        _this.userData = userData;
                    });
                }
            });
            return deferred.promise;
        };
        AuthenticationService.prototype.logOut = function () {
            this.database.unauth();
        };
        AuthenticationService.prototype.onAuthenticationChanged = function (authData) {
            var _this = this;
            if (authData != null) {
                this.getUserData(authData)
                    .then(function (userData) {
                    _this.userData = userData;
                    _this.initializedDeferred.resolve(true);
                });
            }
            else {
                this.userData = null;
                this.initializedDeferred.resolve(true);
            }
        };
        AuthenticationService.prototype.getUserData = function (authData) {
            var _this = this;
            var deferred = this.$q.defer();
            console.log("Authenticated successfully with payload:", authData);
            var userRef = this.usersReference.child(authData.uid);
            userRef.once(Budget.FirebaseEvents.value, function (snapshot) {
                var userData = snapshot.exportVal();
                if (userData != null) {
                    deferred.resolve(userData);
                }
                else {
                    userData = Budget.UserData.fromFirebaseAuthData(authData);
                    _this.$http.get(userData.profileImageUrl, { responseType: "blob" })
                        .then(function (response) {
                        var blob = response.data;
                        _this.$log.debug("Downloaded profile image", response.data);
                        var reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = function () {
                            var base64 = reader.result;
                            _this.$log.debug("Base64", base64);
                            userData.cachedProfileImage = base64;
                            _this.$log.debug("Registering user:", userData);
                            userRef.set(userData, function () { return deferred.resolve(userData); });
                        };
                    });
                }
            });
            return deferred.promise;
        };
        AuthenticationService.IID = "authenticationService";
        AuthenticationService.$inject = [
            "$q",
            "$log",
            "$http",
            Budget.DataService.IID
        ];
        return AuthenticationService;
    })();
    Budget.AuthenticationService = AuthenticationService;
})(Budget || (Budget = {}));
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
    "use strict";
    var NewAccountCtrl = (function () {
        function NewAccountCtrl($stateParams, $state, $scope, $log, dataService, projectData) {
            this.$state = $state;
            this.$log = $log;
            this.dataService = dataService;
            this.projectData = projectData;
            this.subject = "";
            this.description = "";
            $log.debug("Initializing new account controller", $stateParams);
            this.parentId = $stateParams.parentId || "root";
        }
        NewAccountCtrl.prototype.ok = function () {
            var _this = this;
            this.dataService.addChildAccount(this.projectData.key, this.parentId, this.subject, this.description)
                .then(function (x) { return _this.close(); });
        };
        NewAccountCtrl.prototype.cancel = function () {
            this.close();
        };
        NewAccountCtrl.prototype.close = function () {
            this.$log.debug("Closing");
            this.$state.go("logged-in.project.budget-account", { projectId: this.projectData.key, accountId: this.parentId });
        };
        NewAccountCtrl.IID = "newAccountCtrl";
        NewAccountCtrl.controllerAs = NewAccountCtrl.IID + " as vm";
        NewAccountCtrl.$inject = [
            "$stateParams",
            "$state",
            "$scope",
            "$log",
            Budget.DataService.IID,
            "projectData"
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
            if (progress > 100)
                progress = 100;
            var alpha = 2 * Math.PI * progress / 100;
            var x = 40 + 35 * Math.sin(alpha);
            var y = 40 - 35 * Math.cos(alpha);
            var largeArcFlag = progress > 50 ? 1 : 0;
            this.progressPath = "M40,5 A35,35 0 " + largeArcFlag + ",1 " + x + "," + y;
            this.xArcEnd = x;
            this.yArcEnd = y;
        };
        return AccountEx;
    })();
    var AccountOverview = (function () {
        function AccountOverview($log) {
            this.$log = $log;
            this.restrict = "E";
            this.replace = false;
            this.templateUrl = "/templates/account-overview.html";
            this.scope = {
                account: "=",
                showLabels: "="
            };
            this.link = function (scope, elements) {
                scope.accountEx = new AccountEx();
                scope.$watch("account", function () {
                    if (scope.account) {
                        scope.accountEx.balance = scope.account.credited - scope.account.debited;
                        scope.accountEx.progress =
                            scope.account.credited
                                ? Math.round(100 * scope.account.debited / scope.account.credited)
                                : 0;
                        var spent = scope.accountEx.progress;
                        scope.showArc = spent > 0 && spent < 100;
                        scope.showFullCircle = spent >= 100;
                        scope.accountEx.recalculate();
                    }
                });
            };
            $log.debug("Constructing account overview");
        }
        AccountOverview.factory = function () {
            var directive = function ($log) { return new AccountOverview($log); };
            directive.$inject = ["$log"];
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
    "use strict";
    var TransactionViewModel = (function () {
        function TransactionViewModel(label, timestamp) {
            this.label = label;
            this.timestamp = timestamp;
        }
        return TransactionViewModel;
    })();
    Budget.TransactionViewModel = TransactionViewModel;
    var AccountCtrl = (function () {
        function AccountCtrl($scope, $firebaseObject, $firebaseArray, $log, dataService, commandService, projectData, accountSnapshot) {
            var _this = this;
            this.$scope = $scope;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.dataService = dataService;
            this.commandService = commandService;
            this.projectData = projectData;
            this.accountSnapshot = accountSnapshot;
            this.transactions = [];
            $log.debug("Initializing account controller", arguments);
            this.accountData = accountSnapshot.exportVal();
            accountSnapshot.ref()
                .on(Budget.FirebaseEvents.value, function (accountSnapshot) {
                _this.accountData = accountSnapshot.exportVal();
            });
            this.addSubaccountCommand = new Budget.Command("Add subaccount", "/#/budget/project/" + this.projectData.key + "/new/" + this.accountSnapshot.key());
            this.deleteCommand = new Budget.Command("Delete account", "/#/budget/project/" + this.projectData.key + "/delete/" + this.accountSnapshot.key(), false);
            this.allocateBudgetCommand = new Budget.Command("Allocate budget", "/#/budget/project/" + this.projectData.key + "/allocate/" + this.accountSnapshot.key());
            this.addExpenseCommand = new Budget.Command("Register expense", "/#/budget/project/" + this.projectData.key + "/expense/" + this.accountSnapshot.key());
            var projects = dataService.getProjectsReference();
            var childrenQuery = projects
                .child(projectData.key)
                .child("accounts")
                .orderByChild("parent")
                .equalTo(accountSnapshot.key());
            this.subAccounts = $firebaseArray(childrenQuery);
            this.subAccounts.$watch(function (event) { return $log.debug("subAccounts.watch", event, _this.subAccounts); });
            var transactions = projects
                .child(projectData.key)
                .child("transactions");
            var creditTransactionQuery = transactions
                .orderByChild("credit")
                .equalTo(accountSnapshot.key())
                .limitToFirst(10);
            var debitTransactionQuery = transactions
                .orderByChild("debit")
                .equalTo(accountSnapshot.key())
                .limitToFirst(10);
            creditTransactionQuery.on(Budget.FirebaseEvents.child_added, function (snapShot) {
                var transaction = snapShot.exportVal();
                var label = "Credited " + transaction.amount + " from '" + transaction.debitAccountName + "'.";
                var vm = new TransactionViewModel(label, transaction.timestamp);
                _this.insertTransaction(vm);
            });
            debitTransactionQuery.on(Budget.FirebaseEvents.child_added, function (snapShot) {
                var transaction = snapShot.exportVal();
                var label = "Debited " + transaction.amount + " to '" + transaction.creditAccountName + "'.";
                var vm = new TransactionViewModel(label, transaction.timestamp);
                _this.insertTransaction(vm);
            });
            $scope.$on("$ionicView.enter", function () {
                $log.debug("Entering account controller", _this.$scope);
                _this.updateContextCommands();
                _this.setContextCommands();
            });
            this.subAccounts.$watch(function () { return _this.updateContextCommands(); });
            $scope.$watch(function (x) { return _this.transactions; }, function () { return _this.updateContextCommands(); });
        }
        AccountCtrl.resolve = function () {
            return {
                accountSnapshot: ["$stateParams", "projectData", Budget.DataService.IID, AccountCtrl.getAccount]
            };
        };
        AccountCtrl.getAccount = function ($stateParams, projectData, dataService) {
            console.log("Getting account from state parameters", $stateParams, projectData);
            var accountId = $stateParams.accountId || projectData.data.rootAccount;
            return dataService.getAccountSnapshot(projectData.key, accountId);
        };
        AccountCtrl.prototype.insertTransaction = function (transactionVm) {
            var index = 0;
            this.transactions.forEach(function (x) {
                if (x.timestamp > transactionVm.timestamp)
                    index++;
            });
            this.transactions.splice(index, 0, transactionVm);
        };
        AccountCtrl.prototype.updateContextCommands = function () {
            var hasData = this.subAccounts.length === 0 &&
                this.transactions.length === 0;
            if (this.deleteCommand != null) {
                this.deleteCommand.isEnabled = hasData;
            }
        };
        AccountCtrl.prototype.setContextCommands = function () {
            this.commandService.registerContextCommands([
                this.allocateBudgetCommand,
                this.addExpenseCommand,
                this.addSubaccountCommand,
                this.deleteCommand
            ]);
        };
        AccountCtrl.IID = "accountCtrl";
        AccountCtrl.controllerAs = AccountCtrl.IID + " as vm";
        AccountCtrl.$inject = [
            "$scope",
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            Budget.DataService.IID,
            Budget.CommandService.IID,
            "projectData",
            "accountSnapshot"
        ];
        return AccountCtrl;
    })();
    Budget.AccountCtrl = AccountCtrl;
})(Budget || (Budget = {}));
/// <reference path="../services/authentication-service.ts" />
/// <reference path="../services/data-service.ts" />
var Budget;
(function (Budget) {
    'use strict';
    var MainCtrl = (function () {
        function MainCtrl($state, $log, dataService, authenticationService, commandService, userData, rootAccountSnapshot) {
            this.$state = $state;
            this.$log = $log;
            this.dataService = dataService;
            this.authenticationService = authenticationService;
            this.commandService = commandService;
            this.userData = userData;
            console.log("Initializing main controller");
            if (rootAccountSnapshot !== null) {
                this.rootAccount = Budget.AccountData.fromSnapshot(rootAccountSnapshot);
            }
            this.contextCommands = commandService.contextCommands;
            this.imageStyle = {
                "background-image": "url('" + userData.cachedProfileImage + "')"
            };
            $log.debug("imageStyle", this.imageStyle);
        }
        MainCtrl.resolve = function () {
            return {
                userData: ["$q", "$log", Budget.AuthenticationService.IID, MainCtrl.authenticate],
                rootAccountSnapshot: [Budget.DataService.IID, MainCtrl.getAccount]
            };
        };
        MainCtrl.authenticate = function ($q, $log, authenticationService) {
            var deferred = $q.defer();
            authenticationService.initialized
                .then(function (x) {
                var userData = authenticationService.userData;
                $log.debug("User data", userData);
                if (userData) {
                    deferred.resolve(userData);
                }
                else {
                    deferred.reject("authentication");
                }
            });
            return deferred.promise;
        };
        MainCtrl.getAccount = function (dataService) {
            return null; //dataService.getRootAccountSnapshot();
        };
        MainCtrl.prototype.logOut = function () {
            this.authenticationService.logOut();
            this.$state.go("logged-in.home", {}, { reload: true });
        };
        MainCtrl.IID = "mainCtrl";
        MainCtrl.controllerAs = MainCtrl.IID + " as vm";
        MainCtrl.$inject = [
            "$state",
            "$log",
            Budget.DataService.IID,
            Budget.AuthenticationService.IID,
            Budget.CommandService.IID,
            "userData",
            "rootAccountSnapshot"
        ];
        return MainCtrl;
    })();
    Budget.MainCtrl = MainCtrl;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    "use strict";
    var DeleteAccountCtrl = (function () {
        function DeleteAccountCtrl($stateParams, $state, $ionicHistory, $log, dataService, projectData) {
            var _this = this;
            this.$state = $state;
            this.$ionicHistory = $ionicHistory;
            this.dataService = dataService;
            this.projectData = projectData;
            $log.debug("Initializing delete account controller", $stateParams);
            this.accountId = $stateParams.accountId || "root";
            this.dataService.getAccountSnapshot(this.projectData.key, this.accountId)
                .then(function (snapshot) {
                _this.account = snapshot.exportVal();
            });
        }
        DeleteAccountCtrl.prototype.ok = function () {
            var _this = this;
            this.dataService.deleteAccount(this.projectData.key, this.accountId)
                .then(function (x) { return _this.$state.go("logged-in.project.budget-account", { accountId: _this.account.parent }); });
        };
        DeleteAccountCtrl.prototype.cancel = function () {
            this.$state.go("logged-in.project.budget-account", { accountId: this.accountId });
        };
        DeleteAccountCtrl.IID = "deleteAccountCtrl";
        DeleteAccountCtrl.controllerAs = DeleteAccountCtrl.IID + " as vm";
        DeleteAccountCtrl.$inject = [
            "$stateParams",
            "$state",
            "$ionicHistory",
            "$log",
            Budget.DataService.IID,
            "projectData"
        ];
        return DeleteAccountCtrl;
    })();
    Budget.DeleteAccountCtrl = DeleteAccountCtrl;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    "use strict";
    var HelperCommand = (function () {
        function HelperCommand(label, action) {
            this.label = label;
            this.action = action;
        }
        return HelperCommand;
    })();
    Budget.HelperCommand = HelperCommand;
    var AllocateBudgetCtrl = (function () {
        function AllocateBudgetCtrl($stateParams, $scope, $state, $firebaseObject, $firebaseArray, $log, $ionicHistory, $q, dataService, projectData) {
            var _this = this;
            this.$scope = $scope;
            this.$state = $state;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.$ionicHistory = $ionicHistory;
            this.$q = $q;
            this.dataService = dataService;
            this.projectData = projectData;
            this.amount = 0;
            this.isEnabled = false;
            this.helperCommands = [];
            $log.debug("Initializing allocate controller", arguments);
            this.creditAccountId = $stateParams.accountId || "root";
            this.dataService.getAccountSnapshot(this.projectData.key, this.creditAccountId)
                .then(function (snapshot) {
                _this.creditAccount = snapshot.exportVal();
            })
                .then(function (x) {
                if (_this.creditAccount.parent !== "") {
                    _this.getAncestors()
                        .then(function (ancestors) {
                        console.assert(ancestors.length > 0);
                        _this.ancestors = ancestors;
                        _this.debitAccount = ancestors[0];
                    });
                }
            })
                .then(function (_) { return _this.validate(); });
            var us1 = this.$scope.$watch(function () { return _this.amount; }, function (_) { return _this.validate(); });
            var us2 = this.$scope.$watch(function () { return _this.debitAccount; }, function (_) { return _this.validate(); });
        }
        AllocateBudgetCtrl.prototype.ok = function () {
            var _this = this;
            if (this.creditAccount != null && this.creditAccount.parent === "") {
                this.dataService.addTransaction(this.projectData.key, {
                    amount: this.amount,
                    debit: "",
                    debitAccountName: "",
                    credit: this.creditAccountId,
                    creditAccountName: this.creditAccount.subject,
                    timestamp: Firebase.ServerValue.TIMESTAMP
                }).then(function (x) {
                    _this.close();
                });
            }
            else {
                var promises = [];
                // Bubble up the amount to the requested account
                var previousAccount = null;
                // make a copy
                var accounts = this.ancestors.slice(0);
                // add the credit account itself
                accounts.push(Budget.AccountData.fromIAccountData(this.creditAccount, this.creditAccountId));
                // remove up to (including) the debit account
                while (previousAccount == null || previousAccount.key != this.debitAccount.key) {
                    previousAccount = accounts.shift();
                }
                // do the credit bubbling
                accounts.forEach(function (account) {
                    var debitAccount = previousAccount;
                    var creditAccount = account;
                    var promise = _this.dataService.addTransaction(_this.projectData.key, {
                        amount: _this.amount,
                        debit: debitAccount.key,
                        debitAccountName: debitAccount.subject,
                        credit: creditAccount.key,
                        creditAccountName: creditAccount.subject,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    });
                    promises.push(promise);
                    previousAccount = account;
                });
                // wait for all to get saved, then return
                this.$q.all(promises)
                    .then(function (x) { return _this.close(); });
            }
        };
        AllocateBudgetCtrl.prototype.cancel = function () {
            this.close();
        };
        AllocateBudgetCtrl.prototype.close = function () {
            this.$state.go("logged-in.project.budget-account", { accountId: this.creditAccountId });
        };
        AllocateBudgetCtrl.prototype.validate = function () {
            var _this = this;
            var result = false;
            this.helperCommands = [];
            if (this.creditAccount != null && this.creditAccount.parent === "") {
                if (this.amount > 0)
                    result = true;
            }
            else if (this.creditAccount != null &&
                this.debitAccount != null &&
                this.amount > 0) {
                var debitAccountBalance = this.debitAccount.credited - this.debitAccount.debited;
                if (debitAccountBalance < this.amount) {
                    this.helperCommands.push(new HelperCommand("The balance  on '" + this.debitAccount.subject + "' is " + debitAccountBalance + ". Tap to adjust the amount.", function () { return _this.amount = debitAccountBalance; }));
                    this.helperCommands.push(new HelperCommand("Or you could get the amount from free balances", null));
                }
                else {
                    result = true;
                }
            }
            this.isEnabled = result;
        };
        AllocateBudgetCtrl.prototype.getAncestors = function (account) {
            var _this = this;
            if (account === void 0) { account = null; }
            if (!account)
                account = this.creditAccount;
            var deferred = this.$q.defer();
            if (account.parent) {
                this.dataService.getAccountSnapshot(this.projectData.key, account.parent)
                    .then(function (parentSnapshot) {
                    if (parentSnapshot) {
                        var parent = Budget.AccountData.fromSnapshot(parentSnapshot);
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
        AllocateBudgetCtrl.controllerAs = AllocateBudgetCtrl.IID + " as vm";
        AllocateBudgetCtrl.$inject = [
            "$stateParams",
            "$scope",
            "$state",
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            "$ionicHistory",
            "$q",
            Budget.DataService.IID,
            "projectData"
        ];
        return AllocateBudgetCtrl;
    })();
    Budget.AllocateBudgetCtrl = AllocateBudgetCtrl;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    "use strict";
    var AddExpenseCtrl = (function () {
        function AddExpenseCtrl($stateParams, $scope, $state, $firebaseObject, $firebaseArray, $log, $ionicHistory, $q, dataService, projectData) {
            var _this = this;
            this.$scope = $scope;
            this.$state = $state;
            this.$firebaseObject = $firebaseObject;
            this.$firebaseArray = $firebaseArray;
            this.$log = $log;
            this.$ionicHistory = $ionicHistory;
            this.$q = $q;
            this.dataService = dataService;
            this.projectData = projectData;
            this.amount = 0;
            this.isEnabled = false;
            $log.debug("Initializing add expense controller", arguments);
            var debitAccountId = $stateParams.accountId || "root";
            this.dataService.getAccountSnapshot(projectData.key, debitAccountId)
                .then(function (snapshot) {
                _this.debitAccount = Budget.AccountData.fromSnapshot(snapshot);
                _this.validate();
            });
            var us1 = this.$scope.$watch(function () { return _this.amount; }, function (_) { return _this.validate(); });
        }
        AddExpenseCtrl.prototype.ok = function () {
            var _this = this;
            this.dataService.addTransaction(this.projectData.key, {
                amount: this.amount,
                credit: "",
                creditAccountName: "Expenses",
                debit: this.debitAccount.key,
                debitAccountName: this.debitAccount.subject,
                timestamp: Firebase.ServerValue.TIMESTAMP
            }).then(function (x) { return _this.close(); });
        };
        AddExpenseCtrl.prototype.cancel = function () {
            this.close();
        };
        AddExpenseCtrl.prototype.close = function () {
            this.$state.go("logged-in.project.budget-account", { accountId: this.debitAccount.key });
        };
        AddExpenseCtrl.prototype.validate = function () {
            var result = false;
            if (this.debitAccount.credited - this.debitAccount.debited >= this.amount) {
                result = true;
            }
            this.isEnabled = result;
        };
        AddExpenseCtrl.IID = "addExpenseCtrl";
        AddExpenseCtrl.controllerAs = AddExpenseCtrl.IID + " as vm";
        AddExpenseCtrl.$inject = [
            "$stateParams",
            "$scope",
            "$state",
            "$firebaseObject",
            "$firebaseArray",
            "$log",
            "$ionicHistory",
            "$q",
            Budget.DataService.IID,
            "projectData"
        ];
        return AddExpenseCtrl;
    })();
    Budget.AddExpenseCtrl = AddExpenseCtrl;
})(Budget || (Budget = {}));
/// <reference path="../services/authentication-service.ts" />
var Budget;
(function (Budget) {
    var LoginCtrl = (function () {
        function LoginCtrl($stateParams, $state, $scope, $log, authenticationService) {
            this.$stateParams = $stateParams;
            this.$state = $state;
            this.authenticationService = authenticationService;
            this.once = false;
            $log.debug("Initializing login controller", $stateParams.toState, $stateParams.toParams);
        }
        LoginCtrl.prototype.facebook = function () {
            var _this = this;
            if (!this.once) {
                this.once = true;
                this.authenticationService.facebookLogin()
                    .then(function (authData) {
                    _this.$state.go(_this.$stateParams.toState, angular.fromJson(_this.$stateParams.toParams));
                });
            }
        };
        LoginCtrl.IID = "loginCtrl";
        LoginCtrl.controllerAs = LoginCtrl.IID + " as vm";
        LoginCtrl.$inject = [
            "$stateParams",
            "$state",
            "$scope",
            "$log",
            Budget.AuthenticationService.IID,
        ];
        return LoginCtrl;
    })();
    Budget.LoginCtrl = LoginCtrl;
})(Budget || (Budget = {}));
var Budget;
(function (Budget) {
    var ProjectsCtrl = (function () {
        function ProjectsCtrl($log, dataService, authenticationService) {
            var _this = this;
            this.$log = $log;
            this.dataService = dataService;
            this.authenticationService = authenticationService;
            this.projects = [];
            this.newProjectTitle = "";
            $log.debug("Initializing projects controller.");
            authenticationService.initialized
                .then(function (_) { return dataService.getProjectsForUser(authenticationService.userData.uid); })
                .then(function (projects) { return _this.projects = projects; });
        }
        ProjectsCtrl.prototype.onAddNew = function () {
            var _this = this;
            console.assert(this.newProjectTitle.length > 0);
            this.dataService.addNewProject(this.authenticationService.userData.uid, this.newProjectTitle)
                .then(function (x) { return _this.projects.unshift(x); });
            this.newProjectTitle = "";
        };
        ProjectsCtrl.IID = "projectsCtrl";
        ProjectsCtrl.controllerAs = ProjectsCtrl.IID + " as vm";
        ProjectsCtrl.$inject = [
            "$log",
            Budget.DataService.IID,
            Budget.AuthenticationService.IID
        ];
        return ProjectsCtrl;
    })();
    Budget.ProjectsCtrl = ProjectsCtrl;
})(Budget || (Budget = {}));
/// <reference path="services/authentication-service.ts" />
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
/// <reference path="controllers/login-ctrl.ts" />
/// <reference path="controllers/projects-ctrl.ts" />
// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397705
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
var Budget;
(function (Budget) {
    "use strict";
    var budgetModule = angular.module("budget-app", ["ionic", "firebase", "angularMoment"])
        .service(Budget.DataService.IID, Budget.DataService)
        .service(Budget.AuthenticationService.IID, Budget.AuthenticationService)
        .service(Budget.CommandService.IID, Budget.CommandService)
        .directive(Budget.AccountOverview.IID, Budget.AccountOverview.factory())
        .controller(Budget.MainCtrl.IID, Budget.MainCtrl)
        .controller(Budget.AccountCtrl.IID, Budget.AccountCtrl)
        .controller(Budget.NewAccountCtrl.IID, Budget.NewAccountCtrl)
        .controller(Budget.DeleteAccountCtrl.IID, Budget.DeleteAccountCtrl)
        .controller(Budget.AllocateBudgetCtrl.IID, Budget.AllocateBudgetCtrl)
        .controller(Budget.AddExpenseCtrl.IID, Budget.AddExpenseCtrl)
        .controller(Budget.LoginCtrl.IID, Budget.LoginCtrl)
        .controller(Budget.ProjectsCtrl.IID, Budget.ProjectsCtrl);
    budgetModule
        .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
        console.debug("Configuring routes...");
        $stateProvider
            .state("login", {
            url: "/login/:toState/:toParams",
            views: {
                "main-frame": {
                    controller: Budget.LoginCtrl.controllerAs,
                    templateUrl: "templates/login.html"
                }
            }
        });
        $stateProvider.state("logged-in", {
            abstract: true,
            url: "/budget",
            views: {
                "main-frame": {
                    controller: Budget.MainCtrl.controllerAs,
                    templateUrl: "templates/master-page.html"
                }
            },
            resolve: Budget.MainCtrl.resolve()
        });
        $stateProvider.state("logged-in.projects", {
            url: "/projects",
            views: {
                "main-content": {
                    templateUrl: "templates/projects.html",
                    controller: Budget.ProjectsCtrl.controllerAs
                }
            }
        });
        $stateProvider.state("logged-in.project", {
            abstract: true,
            url: "/project/:projectId",
            resolve: Budget.ProjectCtrl.resolve(),
            views: {
                "main-content": {
                    template: "<ion-nav-view name='main-content'></ion-nav-view>",
                    controller: Budget.ProjectCtrl
                }
            }
        });
        $stateProvider.state("logged-in.project.home", {
            url: "/home",
            views: {
                "main-content": {
                    templateUrl: "templates/account.html",
                    resolve: Budget.AccountCtrl.resolve(),
                    controller: Budget.AccountCtrl.controllerAs
                }
            }
        });
        $stateProvider.state("logged-in.project.budget-account", {
            url: "/account/:accountId",
            views: {
                "main-content": {
                    templateUrl: "templates/account.html",
                    resolve: Budget.AccountCtrl.resolve(),
                    controller: Budget.AccountCtrl.controllerAs
                }
            }
        });
        $stateProvider.state("logged-in.project.new-account", {
            url: "/new/:parentId",
            views: {
                "main-content": {
                    templateUrl: "templates/new-account.html",
                    //resolve: AccountCtrl.resolve(),   
                    controller: Budget.NewAccountCtrl.controllerAs
                }
            }
        });
        $stateProvider.state("logged-in.project.delete-account", {
            url: "/delete/:accountId",
            views: {
                "main-content": {
                    templateUrl: "templates/delete-account.html",
                    //resolve: AccountCtrl.resolve(),   
                    controller: Budget.DeleteAccountCtrl.controllerAs
                }
            }
        });
        $stateProvider.state("logged-in.project.allocate", {
            url: "/allocate/:accountId",
            views: {
                "main-content": {
                    templateUrl: "templates/allocate.html",
                    //resolve: AllocateBudgetCtrl.resolve(),   
                    controller: Budget.AllocateBudgetCtrl.controllerAs
                }
            }
        });
        $stateProvider.state("logged-in.project.expense", {
            url: "/expense/:accountId",
            views: {
                "main-content": {
                    templateUrl: "templates/expense.html",
                    //resolve: AllocateBudgetCtrl.resolve(),   
                    controller: Budget.AddExpenseCtrl.controllerAs
                }
            }
        });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise("/budget/projects");
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
    function initialize() {
        // ReSharper disable Html.EventNotResolved
        document.addEventListener("deviceready", onDeviceReady, false);
        // ReSharper restore Html.EventNotResolved
    }
    Budget.initialize = initialize;
    function run($ionicPlatform, $rootScope, $state, $log) {
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
        $log.debug("Setting up $rootscope logging...");
        $rootScope.$on("$stateChangeStart", function (event, toState, toParams) {
            $log.debug("$stateChangeStart to " + toState.to + "- fired when the transition begins. toState,toParams : \n", toState, toParams);
        });
        $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams) {
            $log.debug("$stateChangeError - fired when an error occurs during transition.", event, toState, toParams, fromState, fromParams);
        });
        $rootScope.$on("$stateChangeSuccess", function (event, toState) {
            $log.debug("$stateChangeSuccess to " + toState.name + "- fired once the state transition is complete.");
        });
        $rootScope.$on("$viewContentLoaded", function (event) {
            $log.debug("$viewContentLoaded - fired after dom rendered", event);
        });
        $rootScope.$on("$stateNotFound", function (event, unfoundState, fromState, fromParams) {
            $log.debug("$stateNotFound " + unfoundState.to + "  - fired when a state cannot be found by its name.");
            $log.debug(unfoundState, fromState, fromParams);
        });
        $log.debug("Setting up authentication...");
        $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, reason) {
            if (reason === "authentication") {
                event.preventDefault();
                $state.go("login", { toState: toState.name, toParams: angular.toJson(toParams) });
            }
        });
    }
    budgetModule.run(["$ionicPlatform", "$rootScope", "$state", "$log", run]);
})(Budget || (Budget = {}));
// Platform specific overrides will be placed in the merges folder versions of this file 
var Budget;
(function (Budget) {
    var ProjectCtrl = (function () {
        function ProjectCtrl($log, projectData) {
            this.projectData = projectData;
            $log.debug("Initializing project controller", projectData);
        }
        ProjectCtrl.resolve = function () {
            return {
                projectData: [
                    "$stateParams", "$log", Budget.DataService.IID, function ($stateParams, $log, dataService) {
                        $log.debug("ProjectCtrl resolving project", $stateParams);
                        dataService.getProjectHeader($stateParams.projectId);
                    }
                ] };
        };
        ProjectCtrl.IID = "projectCtrl";
        ProjectCtrl.controllerAs = ProjectCtrl.IID + " as projectVm";
        ProjectCtrl.$inject = [
            "$log",
            "projectData"
        ];
        return ProjectCtrl;
    })();
    Budget.ProjectCtrl = ProjectCtrl;
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
var Budget;
(function (Budget) {
    var UserData = (function () {
        function UserData(uid, provider, expires, 
            // public token: string,
            firstName, lastName, name, displayName, timezone, gender, profileImageUrl) {
            this.uid = uid;
            this.provider = provider;
            this.expires = expires;
            this.firstName = firstName;
            this.lastName = lastName;
            this.name = name;
            this.displayName = displayName;
            this.timezone = timezone;
            this.gender = gender;
            this.profileImageUrl = profileImageUrl;
        }
        UserData.fromFirebaseAuthData = function (authData) {
            var facebookData = authData.facebook;
            return new UserData(authData.uid, authData.provider, authData.expires, 
            // authData.token,
            facebookData.cachedUserProfile.first_name, facebookData.cachedUserProfile.last_name, facebookData.cachedUserProfile.name, facebookData.displayName, facebookData.cachedUserProfile.timezone, facebookData.cachedUserProfile.gender, facebookData.profileImageURL);
        };
        return UserData;
    })();
    Budget.UserData = UserData;
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