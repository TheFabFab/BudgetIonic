module Budget {
    export class BudgetItem {
        public progress: number;
        public prediction: number;
        public progressPath: string;
        public xArcEnd: number;
        public yArcEnd: number;

        constructor(
            public subject: string,
            public description: string,
            public planned: number,
            public spent: number,
            public remaining: number,
            public subitems: BudgetItem[] = []
        ) {
            this.progress = Math.round(100 * spent / (spent + remaining));
            this.prediction = Math.round(100 * (spent + remaining) / planned);
            this.calculateProgressPath();
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
    }
}