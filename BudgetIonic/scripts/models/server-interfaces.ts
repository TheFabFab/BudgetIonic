module Budget {
    export interface ITransactionData {
        debit: string;
        credit: string;
        amount: number;
        timestamp: number;
    }

    export interface IAccountData {
        subject: string;
        description: string;
        parent: string;
        debited: number;
        credited: number;
        lastAggregationTime: number;
    }
}