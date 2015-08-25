module Budget {
    export class Command {
        constructor(
            public label: string,
            public link: string,
            public isEnabled: boolean = true) {
        }
    }
}