/// <reference path="data-service.ts" />
module Budget {
    export interface IAuthenticationService {
        initialized: ng.IPromise<boolean>;
        userData: UserData;

        facebookLogin(): ng.IPromise<UserData>;
        logOut(): void;
    }

    export class AuthenticationService {
        public static IID = "authenticationService";

        private database: Firebase;
        private usersReference: Firebase;
        private initializedDeferred: ng.IDeferred<boolean>;

        public userData: UserData;
        public initialized: ng.IPromise<boolean>;
        
        public static $inject = [
            "$q",
            "$log",
            "$http",
            DataService.IID
        ];

        constructor(private $q: ng.IQService, private $log: ng.ILogService, private $http: ng.IHttpService, private dataService: IDataService) {
            $log.debug("Creating authentication service");

            this.database = dataService.getDatabaseReference();
            this.usersReference = dataService.getUsersReference();
            this.initializedDeferred = $q.defer<boolean>();
            this.initialized = this.initializedDeferred.promise;
            this.database.onAuth(authData => this.onAuthenticationChanged(authData));
        }

        public facebookLogin(): ng.IPromise<UserData> {
            var deferred = this.$q.defer<UserData>();

            this.database.authWithOAuthPopup("facebook", (error, authData) => {
                if (error) {
                    console.log("Login Failed!", error);
                    deferred.reject(error);
                } else {
                    this.getUserData(authData)
                        .then(userData => {
                            deferred.resolve(userData);
                            this.userData = userData;
                        });
                }
            });

            return deferred.promise;
        }

        public logOut(): void {
            this.database.unauth();
        }

        private onAuthenticationChanged(authData: FirebaseAuthData): void {
            if (authData != null) {
                this.getUserData(authData)
                    .then(userData => {
                        this.userData = userData;
                        this.initializedDeferred.resolve(true);
                    });
            } else {
                this.userData = null;
                this.initializedDeferred.resolve(true);
            }
        }

        private getUserData(authData: FirebaseAuthData): ng.IPromise<UserData> {
            var deferred = this.$q.defer<UserData>();

            console.log("Authenticated successfully with payload:", authData);
            var userRef = this.usersReference.child(authData.uid);
            userRef.once(FirebaseEvents.value, snapshot => {
                var userData = snapshot.exportVal<UserData>();

                if (userData != null) {
                    deferred.resolve(userData);
                } else {
                    userData = UserData.fromFirebaseAuthData(authData);

                    this.$http.get(userData.profileImageUrl, { responseType: "blob" })
                        .then(response => {
                            let blob = <Blob>response.data;
                            this.$log.debug("Downloaded profile image", response.data);

                            let reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = () => {
                                let base64 = reader.result;
                                this.$log.debug("Base64", base64);

                                userData.cachedProfileImage = base64;
                                this.$log.debug("Registering user:", userData);
                                userRef.set(userData, () => deferred.resolve(userData));
                            }
                        });
                }
            });

            return deferred.promise;
        }
    }
}