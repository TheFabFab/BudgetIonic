module Budget {
    export class BudgetTransaction {

        constructor(
            private _spent: number,
            private _reduced: number,
            private _date: number = Date.now(),
            private _user: string = 'admin') {
        }

        public get spent(): number {
            return this._spent;
        }

        public get reduced(): number {
            return this._reduced;
        }
    }
}