module Budget {
    export class AccountData implements IAccountData {
        constructor(
            public subject: string,
            public description: string,
            public parent: string,
            public debited: number,
            public credited: number,
            public lastAggregationTime: number,
            public key: string) {
        }

        public static fromIAccountData(other: IAccountData, key: string): AccountData {
            return new AccountData(
                other.subject,
                other.description,
                other.parent,
                other.debited,
                other.credited,
                other.lastAggregationTime,
                key);
        }

        public static fromSnapshot(snapshot: FirebaseDataSnapshot): AccountData {
            return AccountData.fromIAccountData(snapshot.exportVal<IAccountData>(), snapshot.key());
        }
    }
}