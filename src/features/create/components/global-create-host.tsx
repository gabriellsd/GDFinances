"use client";

import { useUIStore } from "@/store/ui-store";
import { TransactionCreateDialog } from "@/features/create/components/transaction-create-dialog";
import { AccountCreateDialog } from "@/features/create/components/account-create-dialog";
import { CategoryCreateDialog } from "@/features/create/components/category-create-dialog";

export function GlobalCreateHost() {
  const createIntent = useUIStore((s) => s.createIntent);
  const closeCreate = useUIStore((s) => s.closeCreate);

  return (
    <>
      <TransactionCreateDialog
        open={createIntent === "income"}
        type="income"
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      />
      <TransactionCreateDialog
        open={createIntent === "expense"}
        type="expense"
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      />
      <AccountCreateDialog
        open={createIntent === "account"}
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      />
      <CategoryCreateDialog
        open={createIntent === "category"}
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      />
    </>
  );
}
