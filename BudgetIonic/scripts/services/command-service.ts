/// <reference path="../models/command.ts" />
module Budget {
    export class CommandService {
        public static IID: string = "commandService";

        public contextCommands: Command[] = [];

        constructor() {
        }

        public registerContextCommands(commands: Command[]) {
            this.contextCommands.length = 0;
            commands.forEach(c => {
                this.contextCommands.push(c);
            });
        }
    }
}