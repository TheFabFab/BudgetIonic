module Budget {
    export class UserData {

        public cachedProfileImage: string;

        constructor(
            public uid: string,
            public provider: string,
            public expires: number,
            // public token: string,
            public firstName: string,
            public lastName: string,
            public name: string,
            public displayName: string,
            public timezone: number,
            public gender: string,
            public profileImageUrl: string) {
            
        }

        public static fromFirebaseAuthData(authData: FirebaseAuthData) {
            var facebookData = (<any>authData).facebook;

            return new UserData(
                authData.uid,
                authData.provider,
                authData.expires,
                // authData.token,
                facebookData.cachedUserProfile.first_name,
                facebookData.cachedUserProfile.last_name,
                facebookData.cachedUserProfile.name,
                facebookData.displayName,
                facebookData.cachedUserProfile.timezone,
                facebookData.cachedUserProfile.gender,
                facebookData.profileImageURL
            );
        }

    }
}