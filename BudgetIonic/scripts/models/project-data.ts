module Budget {
    export class ProjectNode {
        constructor(
            public transactions: Object,
            public accounts: Object,
            public users: Object) {
        }
    }

    export class ProjectHeader {
        constructor(
            public title: string,
            public rootAccount: string) {
        }        
    }

    export class ProjectUserData {
        constructor(
            public lastAccessTime: number) {
        }
    }

    export class ProjectOfUser {
        constructor(
            public title: string,
            public lastAccessTime: number,
            public key: string) {
            
        }
    }

    export class DataWithKey<T> {
        constructor(public key: string, public data: T) {
            
        }

        public static fromSnapshot<T>(snapshot: FirebaseDataSnapshot) {
            return new DataWithKey(snapshot.key(), snapshot.exportVal<T>());
        }
    }
}