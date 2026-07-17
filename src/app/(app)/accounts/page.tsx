import {
  listAccounts,
  syncCashBalancesFromTransactions,
} from "@/features/accounts/actions";
import { listTransactions } from "@/features/transactions/actions";
import { AccountsManager } from "@/features/accounts/components/accounts-manager";

export default async function AccountsPage() {
  await syncCashBalancesFromTransactions();
  const [accounts, transactions] = await Promise.all([
    listAccounts(),
    listTransactions(),
  ]);
  return <AccountsManager accounts={accounts} transactions={transactions} />;
}
