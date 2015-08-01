module BudgetTestData {

    export class MockDataService implements Budget.IDataService {

        private _rootAccount: Budget.Account;
        private _accountMap: Budget.Account[] = [];
        private _loaded: ng.IPromise<boolean>;
        private _newTransactionAvailable = new Budget.LiteEvent<Budget.ITransactionData>();

        constructor($q: ng.IQService) {
            console.log("Costructing test data");

            var resolved = $q.defer();
            this._loaded = resolved.promise;
            resolved.resolve(true);

            var rootKey = _.keys(this.testData.accounts)[0];
            var rootValue = this.testData.accounts[rootKey];

            this._rootAccount = this.loadAccounts(rootKey, rootValue);
            console.log(this._accountMap);
        }

        public getRootAccount(): Budget.Account {
            return this._rootAccount;
        }

        public getAccount(key: string): Budget.Account {
            return this._accountMap[key];
        }

        public loaded(): ng.IPromise<boolean> {
            return this._loaded;
        }

        public newTransactionAvailable(): Budget.LiteEvent<Budget.ITransactionData> {
            return this._newTransactionAvailable;
        }

        public addTransaction(transaction: Budget.ITransactionData) {
            this._newTransactionAvailable.trigger(transaction);
        }

        private loadAccounts(key, value): Budget.Account {
            var keys = _(this.testData.accounts).keys();
            var subAccounts = [];
            keys.forEach(childKey => {
                var childValue = this.testData.accounts[childKey];
                if (childValue.parent == key) {
                    subAccounts.push(this.loadAccounts(childKey, childValue));
                }
            });

            var mockFirebaseObject = <Firebase>{
                on: (event: string, callback: any) => { },
            };

            var mockSnapshot = <FirebaseDataSnapshot>{
                val: () => value,
                key: () => key,
            };

            var creditTransactions =
                _(this.testData.transactions)
                    .where({ credit: key })
                    .map(x => <Budget.ITransactionData>x);

            var debitTransactions =
                _(this.testData.transactions)
                    .where({ debit: key })
                    .map(x => <Budget.ITransactionData>x);

            var account = new Budget.Account(this, mockFirebaseObject, mockSnapshot, subAccounts, creditTransactions, debitTransactions);
            this._accountMap[key] = account;
            return account;
        }

        private testData: any = {
            "accounts": {
                "-JvFY-oIBp_fPP2fdjPs": {
                    "description": "This is the root node",
                    "subject": "My budget"
                },
                "-JvFY-qd5ENTALnsJK17": {
                    "description": "",
                    "parent": "-JvFY-oIBp_fPP2fdjPs",
                    "subject": "Item1"
                },
                "-JvFY-qeqZSyRMy3gbYX": {
                    "description": "",
                    "parent": "-JvFY-oIBp_fPP2fdjPs",
                    "subject": "Item2"
                },
                "-JvFY-qfi4PyILTndLyS": {
                    "description": "",
                    "parent": "-JvFY-oIBp_fPP2fdjPs",
                    "subject": "Item3"
                }
            },
            "transactions": {
                "-JvFXcS58nzhZtvCqPs-": {
                    "amount": 65000,
                    "credit": "-JvFXbxsSPG6I_e0kSL5",
                    "timestamp": 1438017816537
                },
                "-JvFXcS89zhEuUTvigr1": {
                    "amount": 25000,
                    "credit": "-JvFXcCTlZzMNmHolU16",
                    "debit": "-JvFXbxsSPG6I_e0kSL5",
                    "timestamp": 1438017816538
                },
                "-JvFXcSCKAESk_PJpdh6": {
                    "amount": 20000,
                    "credit": "-JvFXcCat61F5WWW5Ss8",
                    "debit": "-JvFXbxsSPG6I_e0kSL5",
                    "timestamp": 1438017816545
                },
                "-JvFXcSJdP2cUgUF6-mL": {
                    "amount": 20000,
                    "credit": "-JvFXcCeLxetZDIzVzLT",
                    "debit": "-JvFXbxsSPG6I_e0kSL5",
                    "timestamp": 1438017816553
                },
                "-JvFXudg0V4Q791sMMOg": {
                    "amount": 65000,
                    "credit": "-JvFXuNITijHwJggRpJV",
                    "timestamp": 1438017891071
                },
                "-JvFXudllGpTLLjaA-G3": {
                    "amount": 25000,
                    "credit": "-JvFXu_ASiheReKgI3vV",
                    "debit": "-JvFXuNITijHwJggRpJV",
                    "timestamp": 1438017891080
                },
                "-JvFXudrzv-FTxAjj-JO": {
                    "amount": 20000,
                    "credit": "-JvFXu_G3dlklazUKYq3",
                    "debit": "-JvFXuNITijHwJggRpJV",
                    "timestamp": 1438017891084
                },
                "-JvFXuduE53fQyGDcAyI": {
                    "amount": 20000,
                    "credit": "-JvFXu_JasRQgiWPcSns",
                    "debit": "-JvFXuNITijHwJggRpJV",
                    "timestamp": 1438017891084
                },
                "-JvFY-v8qBF5vUc1FkxO": {
                    "amount": 65000,
                    "credit": "-JvFY-oIBp_fPP2fdjPs",
                    "timestamp": 1438017916759
                },
                "-JvFY-vCcznG8Es18076": {
                    "amount": 25000,
                    "credit": "-JvFY-qd5ENTALnsJK17",
                    "debit": "-JvFY-oIBp_fPP2fdjPs",
                    "timestamp": 1438017916764
                },
                "-JvFY-vFVxkbUZqdxLl4": {
                    "amount": 20000,
                    "credit": "-JvFY-qeqZSyRMy3gbYX",
                    "debit": "-JvFY-oIBp_fPP2fdjPs",
                    "timestamp": 1438017916765
                },
                "-JvFY-vJtoiR456UXKJA": {
                    "amount": 20000,
                    "credit": "-JvFY-qfi4PyILTndLyS",
                    "debit": "-JvFY-oIBp_fPP2fdjPs",
                    "timestamp": 1438017916769
                }
            }
        };
    } 
}