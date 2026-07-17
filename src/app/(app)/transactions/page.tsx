import {
  listAccounts,
  syncCashBalancesFromTransactions,
} from "@/features/accounts/actions";
import { listCategories } from "@/features/categories/actions";
import { listTransactions } from "@/features/transactions/actions";
import { TransactionsManager } from "@/features/transactions/components/transactions-manager";

export default async function TransactionsPage() {
  await syncCashBalancesFromTransactions();
  const [transactions, accounts, categories] = await Promise.all([
    listTransactions(),
    listAccounts(),
    listCategories(),
  ]);

  return (
    <TransactionsManager
      transactions={transactions}
      accounts={accounts}
      categories={categories}
    />
  );
}
