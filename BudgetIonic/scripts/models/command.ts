module Budget {
    export class Command {
        constructor(
            private $state: ng.ui.IStateService,
            public label: string,
            private to: string,
            private params: {},
            public isEnabled: boolean = true) {
        }

        public go() {
            this.$state.go(this.to, this.params);
        }
    }
}