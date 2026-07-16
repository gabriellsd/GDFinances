import { listAccounts } from "@/features/accounts/actions";
import { AccountsManager } from "@/features/accounts/components/accounts-manager";

export default async function AccountsPage() {
  const accounts = await listAccounts();
  return <AccountsManager accounts={accounts} />;
}
