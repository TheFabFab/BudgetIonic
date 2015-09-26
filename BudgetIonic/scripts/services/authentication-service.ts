/// <reference path="../../typings/rx/rx-lite.d.ts" />
/// <reference path="../typings/extensions.d.ts" />
/// <reference path="../../typings/rx/rx.d.ts" />
/// <reference path="data-service.ts" />
module Budget {
    export interface IAuthenticationService {
        authentication: Rx.Observable<UserData>;
        facebookLogin(): void;
        logOut(): void;
    }

    export class AuthenticationService {
        public static IID = "authenticationService";

        private database: Firebase;

        public authentication: Rx.Observable<UserData>;
        public initialized: ng.IPromise<boolean>;
        
        public static $inject = [
            "$q",
            "$log",
            "$http",
            "$cordovaOauth",
            DataService.IID
        ];

        constructor(private $q: ng.IQService, private $log: ng.ILogService, private $http: ng.IHttpService, private $cordovaOauth: any, private dataService: IDataService) {
            $log.debug("Creating authentication service");

            this.database = dataService.getDatabaseReference();

            this.authentication = Rx.Observable.create<FirebaseAuthData>(observer => {
                const onComplete = (authData: FirebaseAuthData) => observer.onNext(authData);
                this.database.onAuth(onComplete);
                return Rx.Disposable.create(() => this.database.offAuth(onComplete));
            }).flatMap(authData => Rx.Observable.fromPromise<UserData>(this.getUserData(authData)))
            .publish()
            .refCount();
        }

        public facebookLogin(): void {
            if (window.cordova) {
                this.$log.debug("Logging in with Facebook through OAuth popup...", this.$cordovaOauth);

                this.$cordovaOauth.facebook("1632738816997626", ["email"], {
                    redirect_uri: "https://auth.firebase.com/v2/budgetionic/auth/facebook/callback",
                })
                    .then(result => {
                        this.database.authWithOAuthToken("facebook", result.access_token, error => {
                            if (error) {
                                this.$log.error("Login failed with OAuth token. Bailing.", error);
                            } else {
                                this.$log.info("Authentication successful.");
                            }
                        });
                    }, error => {
                        this.$log.error("Login failed with OAuth token. Bailing.", error);
                    });
            } else {
                this.database.authWithOAuthPopup("facebook", (error, authData) => {
                    if (error) {
                        this.$log.warn("Login failed with OAuth popup. Retrying with OAuth redirect.", error);
                        this.database.authWithOAuthRedirect("facebook", error => {
                            if (error) {
                                this.$log.error("Login failed with OAuth redirect. Bailing.", error);
                            } else {
                                this.$log.info("Authentication with OAuth redirect succeeded.");
                            }
                        });
                    } else {
                        this.$log.info("Authentication with OAuth popup succeeded.");
                    }
                });
            }
        }

        public logOut(): void {
            this.database.unauth();
        }

        private getUserData(authData: FirebaseAuthData): ng.IPromise<UserData> {
            var deferred = this.$q.defer<UserData>();

            if (!authData) {
                deferred.resolve(null);
            } else {
                console.log("Authenticated successfully with payload:", authData);
                var userRef = this.database.child("users").child(authData.uid);
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
            }

            return deferred.promise;
        }
    }
}