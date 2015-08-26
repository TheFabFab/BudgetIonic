/// <reference path="../budgetionic/scripts/typings/firebase/firebase.d.ts" />
/// <reference path="../budgetionic/scripts/models/server-interfaces.ts" />
/// <reference path="../budgetionic/scripts/typings/firebase-extensions.d.ts" />
var Firebase: FirebaseStatic = require("firebase");

var database = new Firebase("https://budgetionic.firebaseio.com/");
var transactionsReference = database.child("transactions");
var accountsReference = database.child("accounts");

accountsReference.once("value", accountsSnapshot => {
    accountsSnapshot.forEach(accountSnapshot => {
        var accountReference = accountsReference.child(accountSnapshot.key());
        console.log(accountReference.key(), accountSnapshot.exportVal());
        accountReference.transaction<Budget.IAccountData>(account => {
            console.log(account);
            if (account) {
                return <Budget.IAccountData>{
                    subject: account.subject,
                    description: account.description,
                    parent: account.parent || '',
                    credited: 0,
                    debited: 0,
                    lastAggregationTime: account.lastAggregationTime,
                };
            }

            return account;
        });
    });

    transactionsReference.on("child_added", transactionSnapshot => {

        var transaction = transactionSnapshot.exportVal<Budget.ITransactionData>();
        console.log("Received transaction", transaction);

        if (transaction.credit && transaction.credit !== "") {
            accountsReference.child(transaction.credit)
                .transaction<Budget.IAccountData>(oldValue => {
                    if (oldValue) {
                        return {
                            subject: oldValue.subject,
                            description: oldValue.description,
                            credited: oldValue.credited + transaction.amount,
                            debited: oldValue.debited,
                            parent: oldValue.parent,
                            lastAggregationTime: oldValue.lastAggregationTime,
                        };
                }

                return oldValue;
            });
        }

        if (transaction.debit && transaction.debit !== "") {
            accountsReference.child(transaction.debit)
                .transaction<Budget.IAccountData>(oldValue => {
                    if (oldValue) {
                        return {
                            subject: oldValue.subject,
                            description: oldValue.description,
                            credited: oldValue.credited,
                            debited: oldValue.debited + transaction.amount,
                            parent: oldValue.parent,
                            lastAggregationTime: oldValue.lastAggregationTime,
                        };
                    }

                    return oldValue;
                });
        }
    });
});

