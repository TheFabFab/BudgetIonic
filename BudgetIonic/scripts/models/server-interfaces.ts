module Budget {
    export interface ITransactionData {
        debit: string;
        debitAccountName: string;
        credit: string;
        creditAccountName: string;
        amount: number;
        timestamp: number;
        userId: string;
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