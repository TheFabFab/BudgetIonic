/// <reference path="data-service.ts" />
module Budget {
    export interface IAuthenticationService {
        onAuth(onComplete: (authData: FirebaseAuthData) => void): void;
        offAuth(onComplete: (authData: FirebaseAuthData) => void): void;
        facebookLogin(): ng.IPromise<UserData>;
        logOut(): void;
    }

    export class AuthenticationService {
        public static IID = "authenticationService";

        private database: Firebase;
        private usersReference: Firebase;
        
        public static $inject = [
            "$q",
            "$log",
            DataService.IID
        ];

        constructor(private $q: ng.IQService, private $log: ng.ILogService, private dataService: IDataService) {
            $log.debug("Creating authentication service");

            this.database = dataService.getDatabaseReference();
            this.usersReference = dataService.getUsersReference();
        }

        public onAuth(onComplete: (authData: FirebaseAuthData) => void): void {
            this.database.onAuth(onComplete);
        }

        public offAuth(onComplete: (authData: FirebaseAuthData) => void): void {
            this.database.offAuth(onComplete);
        }

        public facebookLogin(): ng.IPromise<UserData> {
            var deferred = this.$q.defer<UserData>();

            this.database.authWithOAuthPopup("facebook", (error, authData) => {
                if (error) {
                    console.log("Login Failed!", error);
                    deferred.reject(error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                    var userRef = this.usersReference.child(authData.uid);
                    userRef.once(FirebaseEvents.value, snapshot => {
                        var userData = snapshot.exportVal<UserData>();

                        if (userData != null) {
                            deferred.resolve(userData);
                        } else {
                            userData = UserData.fromFirebaseAuthData(authData);
                            this.$log.debug("Registering user:", userData);
                            userRef.set(userData, () => deferred.resolve(userData));
                        }
                    });
                }
            });

            return deferred.promise;
        }

        public logOut(): void {
            this.database.unauth();
        }
    }
}