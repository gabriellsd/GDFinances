import { listAccounts } from "@/features/accounts/actions";
import { listCategories } from "@/features/categories/actions";
import { listTransactions } from "@/features/transactions/actions";
import { TransactionsManager } from "@/features/transactions/components/transactions-manager";

export default async function TransactionsPage() {
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
