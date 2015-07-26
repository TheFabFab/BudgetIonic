/// <reference path="../typings/underscore-observable-arrays/underscore-observable-arrays.d.ts" />
/// <reference path="budget-transaction.ts" />
/// <reference path="lite-events.ts" />

module Budget {
    export class BudgetItem {
        private changed: LiteEvent<BudgetItem> = new LiteEvent();

        public progress: number;
        public prediction: number;
        public progressPath: string;
        public xArcEnd: number;
        public yArcEnd: number;

        constructor(
            public id: number,
            public subject: string,
            public description: string,
            public planned: number,
            public spent: number,
            public remaining: number,
            public subitems: BudgetItem[] = [],
            public transactions: BudgetTransaction[] = []
        ) {
            _.observe(transactions, (new_array, old_array) => this.transactionsUpdated(new_array, old_array));
            _.observe(subitems, (new_array, old_array) => this.subitemsUpdated(new_array, old_array));

            this.subitems.forEach(x => x.changed.on(child => this.onChildChanged(child)));
            this.recalculate();
        }

        private calculateProgressPath() : void {
            var alpha = 2 * Math.PI * this.progress / 100;
            var x = 40 + 35 * Math.sin(alpha);
            var y = 40 - 35 * Math.cos(alpha);
            var largeArcFlag = this.progress > 50 ? 1 : 0;
            this.progressPath = 'M40,5 A35,35 0 ' + largeArcFlag + ',1 ' + x + ',' + y;
            this.xArcEnd = x;
            this.yArcEnd = y;
        }

        private getAllTransactions(): BudgetTransaction[]{
            var allTransactions = this.transactions.map(x => x);

            return allTransactions;
        }

        private recalculate() {
            var spent = 0;
            var remaining = 0;

            this.transactions.forEach(x => {
                spent += x.spent;
                remaining += -x.reduced;
            });

            this.subitems.forEach(x => {
                spent += x.spent;
                remaining += x.remaining;
            });

            var changed = this.spent != spent || this.remaining != remaining;

            if (changed) {
                this.spent = spent;
                this.remaining = remaining;

                this.changed.trigger(this);
            }

            this.progress = Math.round(100 * this.spent / (this.spent + this.remaining));
            this.prediction = Math.round(100 * (this.spent + this.remaining) / this.planned);
            this.calculateProgressPath();
        }

        private transactionsUpdated(new_array: BudgetTransaction[], old_array: BudgetTransaction[]): void {
            this.recalculate();
        }

        private subitemsUpdated(new_array: BudgetItem[], old_array: BudgetItem[]): void {
            this.recalculate();
        }

        private onChildChanged(child: BudgetItem): void {
            this.recalculate();
        }
    }
}