module Budget {
    export class ProjectData {
        constructor(
            public title: string,
            public rootAccount: string) {
            
        }
    }

    export class ProjectUserData {
        constructor(
            public user: string,
            public projectId: string,
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
}