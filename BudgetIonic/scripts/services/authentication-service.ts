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
            DataService.IID
        ];

        constructor(private $q: ng.IQService, private $log: ng.ILogService, private $http: ng.IHttpService, private dataService: IDataService) {
            $log.debug("Creating authentication service");

            this.database = dataService.getDatabaseReference();

            this.authentication = Rx.Observable.create<FirebaseAuthData>(observer => {
                const onComplete = (authData: FirebaseAuthData) => observer.onNext(authData);
                this.database.onAuth(onComplete);
                return Rx.Disposable.create(() => this.database.offAuth(onComplete));
            }).flatMap(authData => Rx.Observable.fromPromise<UserData>(this.getUserData(authData)));
        }

        public facebookLogin(): void {
            this.$log.debug("Logging in with Facebook...");

            this.database.authWithOAuthPopup("facebook", (error, authData) => {
                if (error) {
                    console.log("Login Failed!", error);
                    this.database.authWithOAuthRedirect("facebook", error => {
                        if (error) {
                            console.log("Login Failed!", error);
                        }
                    });
                }
            });
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