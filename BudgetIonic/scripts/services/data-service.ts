/// <reference path="../models/project-data.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../models/server-interfaces.ts" />
/// <reference path="../models/account-data.ts" />

module Budget {

    export interface IDataService {
        getAccountSnapshot(projectKey:string, accountKey: string): ng.IPromise<FirebaseDataSnapshot>;
        getRootAccountSnapshot(projectKey: string): ng.IPromise<FirebaseDataSnapshot>;
        addChildAccount(projectKey: string, parentKey: string, subject: string, description: string): ng.IPromise<any>;
        deleteAccount(projectKey: string, accountId: string): ng.IPromise<any>;
        addTransaction(projectKey: string, transaction: ITransactionData): ng.IPromise<any>;
        getUsersReference(): Firebase;
        getProjectsReference(): Firebase;
        getDatabaseReference(): Firebase;
        getProjectsForUser(userId: string): ng.IPromise<ProjectOfUser[]>;
        addNewProject(userId: string, projectTitle: string);
        getProjectData(projectId: string): ng.IPromise<DataWithKey<ProjectHeader>>;
    }

    export class DataService implements IDataService {
        public static IID = "dataService";

        public static $inject = [
            "$q",
            "$log"
        ];

        private database: Firebase;

        private usersReference: Firebase;
        private projectsReference: Firebase;
        private projectHeadersReference: Firebase;

        constructor(private $q: ng.IQService, private $log: ng.ILogService) {
            $log.debug("Creating data service");

            this.database = new Firebase("https://budgetionic.firebaseio.com/");

            this.usersReference = this.database.child("users");
            this.projectsReference = this.database.child("projects");
            this.projectHeadersReference = this.database.child("project-headers");
        }

        public getDatabaseReference(): Firebase {
            return this.database;
        }

        public getUsersReference(): Firebase {
            return this.usersReference;
        }

        public getProjectsReference(): Firebase {
            return this.projectsReference;
        }

        public getRootAccountSnapshot(projectKey: string): ng.IPromise<FirebaseDataSnapshot> {
            return this.getAccountSnapshot(projectKey, "");
        }

        public getAccountSnapshot(projectKey: string, accountKey: string): ng.IPromise<FirebaseDataSnapshot> {
            this.$log.debug("Resolving account", projectKey, accountKey);

            var deferred = this.$q.defer<FirebaseDataSnapshot>();

            this.projectsReference
                .child(projectKey)
                .child("accounts")
                .child(accountKey)
                .once(
                    FirebaseEvents.value,
                    snapshot => {
                        this.$log.debug("Resolved account by project and id", snapshot.exportVal());
                        deferred.resolve(snapshot);
                });

            return deferred.promise;
        }

        public addChildAccount(projectKey: string, parentKey: string, subject: string, description: string): ng.IPromise<any> {
            var deferred = this.$q.defer();

            this.projectsReference
                .child(projectKey)
                .child("accounts")
                .push(<IAccountData>{
                    subject: subject,
                    description: description,
                    parent: parentKey,
                    debited: 0,
                    credited: 0,
                    lastAggregationTime: 0
                    },
                error => {
                    if (error == null) deferred.resolve();
                    else deferred.reject(error);
                });

            return deferred.promise;
        }

        public deleteAccount(projectKey: string, accountId: string): ng.IPromise<any> {
            var deferred = this.$q.defer();

            this.getAccountSnapshot(projectKey, accountId)
                .then(accountReference => {
                    accountReference.ref().remove(error => {
                        if (error) deferred.reject(error);
                        else deferred.resolve();
                    });
                });

            return deferred.promise;
        }

        public addTransaction(projectKey: string, transaction: ITransactionData): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference =
                this.projectsReference
                    .child(projectKey)
                    .child("transactions")
                    .push(transaction, x => {
                    deferred.resolve(reference);
            });
            return deferred.promise;
        }

        public getProjectsForUser(userId: string): ng.IPromise<ProjectOfUser[]> {
            var deferred = this.$q.defer<ProjectOfUser[]>();

            this.usersReference
                .child(userId) 
                .child("projects")
                .once(FirebaseEvents.value, userProjectIds => {
                    var projectIds = [];
                    userProjectIds.forEach(snapshot => {
                        projectIds.push({
                            projectId: snapshot.key(),
                            lastAccessTime: snapshot.exportVal<ProjectUserData>().lastAccessTime
                        });
                    });

                    projectIds.sort((a, b) => a.lastAccessTime - b.lastAccessTime);
                    var projectsPromise = projectIds.map(x => {
                        var projectDeferred = this.$q.defer<ProjectOfUser>();
                        var projectDataReference = this.projectHeadersReference.child(x.projectId);

                        projectDataReference.once(FirebaseEvents.value, projectSnapshot => {
                            var projectData = projectSnapshot.exportVal<ProjectHeader>();
                            projectDeferred.resolve(new ProjectOfUser(projectData.title, x.lastAccessTime, x.projectId));
                        });

                        return projectDeferred.promise;
                    });

                    this.$q.all<ProjectOfUser>(projectsPromise).then(x => deferred.resolve(x));
                });

            return deferred.promise;
        }

        public addNewProject(userId: string, projectTitle: string): ng.IPromise<ProjectHeader> {
            var deferred = this.$q.defer<ProjectHeader>();

            let projectNode: ProjectNode = {
                accounts: {},
                transactions: {},
                users: {}
            };

            projectNode.users[userId] = true;

            const projectReference = this.projectsReference.push(projectNode, error => {
                const rootAccount =
                    projectReference
                        .child("accounts").push(<IAccountData>{
                            subject: projectTitle,
                            debited: 0,
                            credited: 0,
                            parent: "",
                            description: "",
                            lastAggregationTime: 0
                        }, error => {
                            this.projectHeadersReference
                                .child(projectReference.key())
                                .set(<ProjectHeader>{
                                    title: projectTitle,
                                    rootAccount: rootAccount.key()
                                }, error => {
                                    var userProjectUpdate = {};
                                    userProjectUpdate[projectReference.key()] = <ProjectUserData>{
                                        lastAccessTime: Firebase.ServerValue.TIMESTAMP
                                    };

                                    this.usersReference
                                        .child(userId)
                                        .child("projects")
                                        .update(userProjectUpdate, error => {
                                            deferred.resolve(<ProjectHeader>{
                                                title: projectTitle,
                                                rootAccount: rootAccount.key()
                                            });
                                        });
                                });
                        });
            });

            return deferred.promise;
        }

        public getProjectData(projectId: string): ng.IPromise<DataWithKey<ProjectHeader>> {
            var deferred = this.$q.defer<DataWithKey<ProjectHeader>>();

            this.projectHeadersReference
                .child(projectId)
                .once(FirebaseEvents.value, snapShot => {
                    this.$log.debug("Found project data", snapShot.exportVal());
                    deferred.resolve(DataWithKey.fromSnapshot<ProjectHeader>(snapShot));
                });

            return deferred.promise;
        }

        private addAccount(projectKey: string, subject: string, parent: string = null, description: string = ""): ng.IPromise<Firebase> {
            var deferred = this.$q.defer<Firebase>();
            var reference =
                this.projectsReference
                    .child(projectKey)
                    .child("accounts")
                    .push(<IAccountData>{
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
    }
}