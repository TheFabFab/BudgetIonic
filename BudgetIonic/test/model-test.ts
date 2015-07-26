describe("budget", () => {
    var budget = new Budget.BudgetItem(0, "Budget", "", 0, 0, 0, [
        new Budget.BudgetItem(1, "Test1", "", 0, 0, 0, [], [
            new Budget.BudgetTransaction(0, -10000, Date.now(), "CsFa"),
            new Budget.BudgetTransaction(1800, 2000, Date.now(), "CsFa"),
            ]),
    ], [ ]);

    it("sums up transactions initially", () => {
        expect(budget.spent).toBe(1800);
        expect(budget.remaining).toBe(8000);
    });

    it("reacts to changes to transactions on the same level", () => {
        budget.transactions.push(new Budget.BudgetTransaction(0, -2000, Date.now(), "CsFa"));
        expect(budget.spent).toBe(1800);
        expect(budget.remaining).toBe(10000);
    });

    it("reacts to changes to transactions on the lower level", () => {
        budget.subitems[0].transactions.push(new Budget.BudgetTransaction(1000, 1000, Date.now(), "CsFa"));
        expect(budget.spent).toBe(2800);
        expect(budget.remaining).toBe(9000);
    });

    it("reacts to changes to subitems", () => {
        budget.subitems.push(new Budget.BudgetItem(2, "Item2", "", 0, 0, 0, [], [
            new Budget.BudgetTransaction(0, -1000, Date.now(), "CsFa")
        ]));
        expect(budget.spent).toBe(2800);
        expect(budget.remaining).toBe(10000);
    });
});