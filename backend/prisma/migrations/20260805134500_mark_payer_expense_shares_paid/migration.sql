-- The payer has already covered their own portion of an expense.
UPDATE "ReunionExpenseShare"
SET
    "status" = 'PAID',
    "paidAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM "ReunionExpense"
    WHERE "ReunionExpense"."id" = "ReunionExpenseShare"."expenseId"
      AND "ReunionExpense"."paidByUserId" = "ReunionExpenseShare"."userId"
);
