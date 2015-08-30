/// <reference path="../models/project-data.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../models/server-interfaces.ts" />
/// <reference path="../models/account-data.ts" />

module Budget {

    export interface IDataService {
        getAccountSnapshot(key: string): ng.IPromise<FirebaseDataSnapshot>;
        getRootAccountSnapshot(): ng.IPromise<FirebaseDataSnapshot>;
        addChildAccount(parentKey: string, subject: string, description: string): ng.IPromise<any>;
        deleteAccount(accountId: string): ng.IPromise<any>;
        addTransaction(transaction: ITransactionData): ng.IPromise<any>;
        getAccountsReference(): Firebase;
        getTransactionsReference(): Firebase;
        getUsersReference(): Firebase;
        getProjectsReference(): Firebase;
        getDatabaseReference(): Firebase;
        getProjectsForUser(userId: string): ng.IPromise<ProjectOfUser[]>;
        addNewProject(userId: string, projectTitle: string);
    }

    export class DataService implements IDataService {
        public static IID = "dataService";

        public static $inject = [
            '$q',
            "$log",
            '$firebaseArray',
        ];

        private database: Firebase;

        private accountsReference: Firebase;
        private transactionsReference: Firebase;
        private usersReference: Firebase;
        private projectsReference: Firebase;
        private projectUserReference: Firebase;

        constructor(private $q: ng.IQService, private $log: ng.ILogService, $firebaseArray: AngularFireArrayService) {
            $log.debug("Creating data service");

            this.database = new Firebase("https://budgetionic.firebaseio.com/");

            this.transactionsReference = this.database.child("transactions");
            this.accountsReference = this.database.child("accounts");
            this.usersReference = this.database.child("users");
            this.projectsReference = this.database.child("projects");
            this.projectUserReference = this.database.child("project-users");
            this.ensureData();
        }

        public getDatabaseReference(): Firebase {
            return this.database;
        }

        public getAccountsReference(): Firebase {
            return this.accountsReference;
        }

        public getTransactionsReference(): Firebase {
            return this.transactionsReference;
        }

        public getUsersReference(): Firebase {
            return this.usersReference;
        }

        public getProjectsReference(): Firebase {
            return this.projectsReference;
        }

        public getRootAccountSnapshot(): ng.IPromise<FirebaseDataSnapshot> {
            return this.getAccountSnapshot('');
        }

        public getAccountSnapshot(key: string): ng.IPromise<FirebaseDataSnapshot> {
            console.log("Resolving account for key: " + key);

            if (key == 'root') {
                key = '';
            }

            var deferred = this.$q.defer<FirebaseDataSnapshot>();

            if (key === '') {
                var query =
                    this.accountsReference
                        .orderByChild("parent")
                        .equalTo('');

                query.once(FirebaseEvents.value, snapshot => {
                    var child: FirebaseDataSnapshot;
                    snapshot.forEach(x => child = x);
                    if (child) {
                        deferred.resolve(child);
                    } else {
                        deferred.reject();
                    }
                });
            } else {
                console.log("Resolving account by key " + key);
                this.accountsReference.child(key).once(
                    FirebaseEvents.value,
                    snapshot => {
                        console.log("Resolved account by id:");
                        console.log(snapshot);
                        deferred.resolve(snapshot);
                    });
            }

            return deferred.promise;
        }

        public addChildAccount(parentKey: string, subject: string, description: string): ng.IPromise<any> {
            var deferred = this.$q.defer();

            this.normalizeAccountKey(parentKey)
                .then(key => {
                    this.accountsReference.push(<IAccountData>{
                        subject: subject,
                        description: description,
                        parent: key,
                        debited: 0,
                        credited: 0,
                        lastAggregationTime: 0,
                    },
                    error => {
                        if (error == null) deferred.resolve();
                        else deferred.reject(error);
                    });
                });

            return deferred.promise;
        }

        public deleteAccount(accountId: string): ng.IPromise<any> {
            var deferred = this.$q.defer();

            this.getAccountSnapshot(accountId)
                .then(accountReference => {
                    accountReference.ref().remove(error => {
                        if (error) deferred.reject(error);
                        else deferred.resolve();
                    });
                });

            return deferred.promise;
        }

        public addTransaction(transaction: ITransactionData): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference = this.transactionsReference.push(transaction, x => {
                deferred.resolve(reference);
            });
            return deferred.promise;
        }

        public getProjectsForUser(userId: string): ng.IPromise<ProjectOfUser[]> {
            var deferred = this.$q.defer<ProjectOfUser[]>();

            this.projectUserReference
                .orderByChild("user")
                .equalTo(userId)
                .once(FirebaseEvents.value, userProjectIds => {
                    var projectUsers: ProjectUserData[] = [];
                    userProjectIds.forEach(snapshot => {
                        var projectUserData = snapshot.exportVal<ProjectUserData>();
                        projectUsers.push(projectUserData);
                    });

                    projectUsers.sort((a, b) => a.lastAccessTime - b.lastAccessTime);
                    var projectsPromise = projectUsers.map(x => {
                        var projectDeferred = this.$q.defer<ProjectOfUser>();
                        var projectTitleReference = this.projectsReference.child(x.projectId).child("title");

                        projectTitleReference.once(FirebaseEvents.value, projectSnapshot => {
                            var projectTitle = projectSnapshot.exportVal<string>();
                            projectDeferred.resolve(new ProjectOfUser(projectTitle, x.lastAccessTime, x.projectId));
                        });

                        return projectDeferred.promise;
                    });

                    this.$q.all(projectsPromise).then(x => deferred.resolve(x));
                });

            return deferred.promise;
        }

        public addNewProject(userId: string, projectTitle: string): ng.IPromise<ProjectData> {
            var deferred = this.$q.defer<ProjectData>();

            let projectReference =
                this.projectsReference.push(<ProjectData>{
                    title: projectTitle,
                    rootAccount: '',
                    accounts: {},
                    transactions: {}
                }, error => {
                    let rootAccount =
                        projectReference.child("accounts").push(<IAccountData>{
                            subject: projectTitle,
                            debited: 0,
                            credited: 0,
                            parent: "",
                            description: "",
                            lastAggregationTime: 0
                        }, error => {
                            projectReference.update({
                                rootAccount: rootAccount.key()
                            }, error => {
                                this.projectUserReference.push(
                                    new ProjectUserData(userId, projectReference.key(), Firebase.ServerValue.TIMESTAMP),
                                    error => {
                                        deferred.resolve(<ProjectData>{
                                            title: projectTitle,
                                            rootAccount: rootAccount.key()
                                        });
                                    });
                            });
                        });
                });

            return deferred.promise;
        }

        private ensureData() {
            this.accountsReference
                .orderByChild("parent")
                .limitToFirst(1)
                .once(
                    FirebaseEvents.value,
                    snapshot => {
                        if (!snapshot.val()) {
                            this.createDemoData();
                        }
                    });
        }

        private normalizeAccountKey(accountKey: string): ng.IPromise<string> {
            var accountKeyDeferred = this.$q.defer();

            if (accountKey == 'root') {
                accountKey = '';
            }

            if (accountKey == '') {
                this.getRootAccountSnapshot().then(x => accountKeyDeferred.resolve(x.key()));
            }
            else {
                accountKeyDeferred.resolve(accountKey);
            }

            return accountKeyDeferred.promise;
        }

        private addAccount(subject: string, parent: string = null, description: string = ''): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference = this.accountsReference.push(<IAccountData>{
                subject: subject,
                description: description,
                parent: parent,
                credited: 0,
                debited: 0,
                lastAggregationTime: 0,
            }, x => {
                deferred.resolve(reference);
            });
            return deferred.promise;
        }

        private createDemoData(): ng.IPromise<{}> {
            var deferred = this.$q.defer();

            console.log("Creating demo data...");

            this.addAccount('My budget', '', 'This is the root node')
                .then(rootNode => this.$q.all<Firebase>([
                    this.addAccount('Item1', rootNode.key()),
                    this.addAccount('Item2', rootNode.key()),
                    this.addAccount('Item3', rootNode.key())
                        .then(item3 => {
                            this.$q.all<Firebase>([
                                this.addAccount('Item3.1', item3.key()),
                                this.addAccount('Item3.2', item3.key()),
                                this.addAccount('Item3.3', item3.key()),
                            ]);

                            return item3;
                        })
                ])
                .then(subitems => {
                this.$q.all<Firebase>([
                    this.addTransaction({
                        debit: null,
                        debitAccountName: '',
                        credit: rootNode.key(),
                        creditAccountName: 'My budget',
                        amount: 65000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        debitAccountName: 'My budget',
                        credit: subitems[0].key(),
                        creditAccountName: 'Item1',
                        amount: 25000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        debitAccountName: 'My budget',
                        credit: subitems[1].key(),
                        creditAccountName: 'Item2',
                        amount: 20000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    }),
                    this.addTransaction({
                        debit: rootNode.key(),
                        debitAccountName: 'My budget',
                        credit: subitems[2].key(),
                        creditAccountName: 'Item3',
                        amount: 10000,
                        timestamp: Firebase.ServerValue.TIMESTAMP
                    })
                ]).then(x => deferred.resolve());
            }));

            return deferred.promise;
        }
    }
}