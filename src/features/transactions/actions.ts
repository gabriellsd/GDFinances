"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  transactionSchema,
  type TransactionInput,
} from "@/lib/validations/finance";
import type { Transaction } from "@/types";
import type { ActionResult } from "@/features/accounts/actions";

export type TransactionWithRelations = Transaction & {
  accounts: { id: string; name: string; color: string } | null;
  categories: { id: string; name: string; color: string } | null;
};

function signedAmount(type: "income" | "expense", amount: number) {
  return type === "income" ? amount : -amount;
}

async function adjustAccountBalance(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  accountId: string,
  delta: number
) {
  const { data: account, error } = await supabase
    .from("accounts")
    .select("current_balance")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (error || !account) {
    throw new Error("Conta não encontrada para atualizar saldo");
  }

  const next = Number(account.current_balance) + delta;
  const { error: updateError } = await supabase
    .from("accounts")
    .update({
      current_balance: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);
}

export async function listTransactions(): Promise<TransactionWithRelations[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "*, accounts(id, name, color), categories(id, name, color)"
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as TransactionWithRelations[];
}

export async function createTransaction(
  input: TransactionInput
): Promise<ActionResult<Transaction>> {
  try {
    const parsed = transactionSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { supabase, user } = await requireUser();
    const values = parsed.data;

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: values.type,
        amount: values.amount,
        account_id: values.account_id,
        category_id: values.category_id || null,
        date: values.date,
        description: values.description || null,
        notes: values.notes || null,
        payment_method: values.payment_method || null,
        is_paid: values.is_paid,
      })
      .select("*")
      .single();

    if (error) return { error: error.message };

    if (values.is_paid) {
      await adjustAccountBalance(
        supabase,
        user.id,
        values.account_id,
        signedAmount(values.type, values.amount)
      );
    }

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true, data: data as Transaction };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao criar transação",
    };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    const { data: current, error: currentError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (currentError || !current) {
      return { error: "Transação não encontrada" };
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    if (current.is_paid && current.type !== "transfer") {
      await adjustAccountBalance(
        supabase,
        user.id,
        current.account_id,
        -signedAmount(current.type as "income" | "expense", Number(current.amount))
      );
    }

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao excluir transação",
    };
  }
}

export async function getDashboardStats() {
  const { supabase, user } = await requireUser();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const [accountsRes, monthTxRes, recentRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, current_balance, color, currency, is_active, bank_name, icon")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("transactions")
      .select("type, amount, is_paid, date")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("transactions")
      .select(
        "id, type, amount, description, date, accounts(name), categories(name, color)"
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(6),
  ]);

  if (accountsRes.error) throw new Error(accountsRes.error.message);
  if (monthTxRes.error) throw new Error(monthTxRes.error.message);
  if (recentRes.error) throw new Error(recentRes.error.message);

  const accounts = accountsRes.data ?? [];
  const monthTx = monthTxRes.data ?? [];

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.current_balance),
    0
  );

  const income = monthTx
    .filter((tx) => tx.type === "income" && tx.is_paid)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const expense = monthTx
    .filter((tx) => tx.type === "expense" && tx.is_paid)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  return {
    totalBalance,
    income,
    expense,
    savings: income - expense,
    accounts,
    recent: recentRes.data ?? [],
  };
}
