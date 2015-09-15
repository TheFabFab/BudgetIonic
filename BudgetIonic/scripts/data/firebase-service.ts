/// <reference path="../../typings/rx/rx.d.ts" />
module Budget.Data {
    import RefCountDisposable = Rx.RefCountDisposable;
    import Disposable = Rx.Disposable;
    import Observable = Rx.Observable;

    class FirebaseEvents {
        public static value = "value";
// ReSharper disable InconsistentNaming
        public static child_added = "child_added";
        public static child_changed = "child_changed";
        public static child_removed = "child_removed";
        public static child_moved = "child_moved";
// ReSharper restore InconsistentNaming
    }

    export class FirebaseService {
        public static IID = "FirebaseService";

        private database: Firebase;
        public users: Users;
        public projects: Projects;

        public static $inject = [
            "$log"
        ];

        constructor(private $log: ng.ILogService) {
            this.database = new Firebase("https://budgetionic.firebaseio.com/");
            this.users = new Users(this.database.child("users"));
            this.projects = new Projects(this.database.child("projects"));
        }
    }

    export class Projects {
        constructor(private node: Firebase) { }
        
        public project(projectId: string): Project {
            return new Project(this.node.child(projectId));
        }
    }

    export class Project {
        constructor(private node: Firebase, public transactions = new Transactions(node.child("transactions"))) { }
    }

    export class Transactions {
        constructor(private node: Firebase) { }

        byTimestamp(): Observable<ITransactionData> {
            return Rx.Observable.create<ITransactionData>(observer => {
                const listener = this.node
                    .orderByChild("timestamp")
                    .on(FirebaseEvents.child_added, snap => {
                        var transaction = snap.exportVal<ITransactionData>();
                        observer.onNext(transaction);
                    });
                var disposable = new Disposable(() => this.node.off(FirebaseEvents.child_added, listener));
                return new RefCountDisposable(disposable);
            });
        }
    }

    export interface ITransactionData {
        debit: string;
        debitAccountName: string;
        credit: string;
        creditAccountName: string;
        amount: number;
        timestamp: number;
        userId: string;
    }

    export class Users {
        constructor(private node: Firebase) { }

        public user(userId: string): User {
            return new User(this.node.child(userId));
        }
    }

    export class User {
        constructor(private node: Firebase) {
            
        }

        public projects(): Observable<UserProject> {
            var projects = this.node.child("projects");

            return Rx.Observable.create<UserProject>(observer => {
                var listener =
                    projects.on(FirebaseEvents.child_added, snapShot => {
                        var data = <any>snapShot.exportVal();
                        observer.onNext(new UserProject(snapShot.key(), data.lastAccessTime));
                    });

                var disposable = new Disposable(() => projects.off(FirebaseEvents.child_added, listener));
                return new RefCountDisposable(disposable);
            });
        }
    }

    export class UserProject {
        constructor(public projectId: string, public lastAccessTime: number) { }
    }

    export class UserData {
        constructor(
            public uid: string,
            public provider: string,
            public expires: number,
            public firstName: string,
            public lastName: string,
            public name: string,
            public displayName: string,
            public timezone: number,
            public gender: string,
            public profileImageUrl: string,
            public cachedProfileImage: string) {
        }
    }
}