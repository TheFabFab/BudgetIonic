module Budget {
    export class BudgetTransaction {

        constructor(
            private _spent: number,
            private _reduced: number,
            private _date: number = Date.now(),
            private _user: string = 'admin') {
        }

        public spent(): number {
            return this._spent;
        }

        public reduced(): number {
            return this._reduced;
        }
    }
}