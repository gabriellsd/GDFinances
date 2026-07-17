import {
  listAccounts,
  syncCashBalancesFromTransactions,
  syncCreditBalancesFromTransactions,
} from "@/features/accounts/actions";
import { listTransactions } from "@/features/transactions/actions";
import { CardsManager } from "@/features/credit-cards/components/cards-manager";

export default async function CardsPage() {
  await Promise.all([
    syncCashBalancesFromTransactions(),
    syncCreditBalancesFromTransactions(),
  ]);
  const [accounts, transactions] = await Promise.all([
    listAccounts(),
    listTransactions(),
  ]);
  const cards = accounts.filter((account) => account.type === "credit");
  const paymentAccounts = accounts.filter((account) => account.type !== "credit");
  return (
    <CardsManager
      cards={cards}
      paymentAccounts={paymentAccounts}
      transactions={transactions}
    />
  );
}
