"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  transactionSchema,
  type TransactionInput,
} from "@/lib/validations/finance";
import { expandRecurringForMonth, type RecurringExpandableTransaction } from "@/lib/recurring-transactions";
import type { Transaction } from "@/types";
import {
  syncCashBalancesFromTransactions,
  syncCreditBalancesFromTransactions,
  type ActionResult,
} from "@/features/accounts/actions";

export type TransactionWithRelations = Transaction & {
  accounts: {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
    bank_name?: string | null;
    type?: string;
  } | null;
  categories: { id: string; name: string; color: string } | null;
};

function signedAmount(type: "income" | "expense", amount: number) {
  return type === "income" ? amount : -amount;
}

async function revalidateFinancePaths(options?: {
  creditPaymentAccountId?: string;
}) {
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/cards");
  await Promise.all([
    syncCashBalancesFromTransactions(options),
    syncCreditBalancesFromTransactions(),
  ]);
}

async function adjustAccountBalance(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  accountId: string,
  delta: number
) {
  const { data: account, error } = await supabase
    .from("accounts")
    .select("current_balance, type")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (error || !account) {
    throw new Error("Conta não encontrada para atualizar saldo");
  }

  // Cartão de crédito: saldo/limite vêm só do sync (despesas a pagar).
  // Não mexe no saldo ao marcar fatura como paga/pendente.
  if (account.type === "credit") {
    return;
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

  const [mainRes, recurringRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "*, accounts(id, name, color, icon, bank_name, type), categories(id, name, color)"
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("transactions")
      .select(
        "*, accounts(id, name, color, icon, bank_name, type), categories(id, name, color)"
      )
      .eq("user_id", user.id)
      .eq("is_recurring", true)
      .order("date", { ascending: true }),
  ]);

  if (mainRes.error) throw new Error(mainRes.error.message);
  if (recurringRes.error) throw new Error(recurringRes.error.message);

  const byId = new Map<string, TransactionWithRelations>();
  for (const row of [...(recurringRes.data ?? []), ...(mainRes.data ?? [])]) {
    byId.set(row.id, row as TransactionWithRelations);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return String(b.created_at).localeCompare(String(a.created_at));
  });
}

/** Materializa uma ocorrência mensal de lançamento fixo (receita/despesa). */
export async function materializeRecurringOccurrence(input: {
  sourceId: string;
  date: string;
  is_paid?: boolean;
}): Promise<ActionResult<Transaction>> {
  try {
    const { supabase, user } = await requireUser();

    const { data: source, error: sourceError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", input.sourceId)
      .eq("user_id", user.id)
      .single();

    if (sourceError || !source) {
      return { error: "Lançamento fixo não encontrado" };
    }

    if (!source.is_recurring) {
      return { error: "Este lançamento não é fixo/recorrente" };
    }

    const isPaid = input.is_paid ?? false;

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: source.type,
        amount: source.amount,
        account_id: source.account_id,
        category_id: source.category_id,
        date: input.date,
        description: source.description,
        notes: source.notes,
        payment_method: source.payment_method,
        is_paid: isPaid,
        is_recurring: true,
        installment_count: null,
        installment_current: null,
      })
      .select("*")
      .single();

    if (error) return { error: error.message };

    if (isPaid && source.type !== "transfer") {
      await adjustAccountBalance(
        supabase,
        user.id,
        source.account_id,
        signedAmount(source.type as "income" | "expense", Number(source.amount))
      );
    }

    await revalidateFinancePaths();
    return { success: true, data: data as Transaction };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erro ao gerar ocorrência do mês",
    };
  }
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
    const isRecurring = values.recurrence === "fixed";
    const isInstallment = values.recurrence === "installment";
    const installmentCount = isInstallment
      ? Number(values.installment_count)
      : null;

    const baseDescription = values.description?.trim() || null;

    if (isInstallment && installmentCount) {
      const parcelAmounts = splitAmount(values.amount, installmentCount);

      const rows = Array.from({ length: installmentCount }, (_, index) => {
        const installmentNumber = index + 1;
        const date = addMonthsISO(values.date, index);
        const isFirst = installmentNumber === 1;
        return {
          user_id: user.id,
          type: values.type,
          amount: parcelAmounts[index],
          account_id: values.account_id,
          category_id: values.category_id || null,
          date,
          description: baseDescription
            ? `${baseDescription} (${installmentNumber}/${installmentCount})`
            : `Parcela ${installmentNumber}/${installmentCount}`,
          notes: values.notes || null,
          payment_method: values.payment_method || null,
          is_paid: isFirst ? values.is_paid : false,
          is_recurring: false,
          installment_count: installmentCount,
          installment_current: installmentNumber,
        };
      });

      const { data, error } = await supabase
        .from("transactions")
        .insert(rows)
        .select("*");

      if (error) return { error: error.message };

      const first = data?.[0];
      if (first?.is_paid) {
        await adjustAccountBalance(
          supabase,
          user.id,
          values.account_id,
          signedAmount(values.type, Number(first.amount))
        );
      }

      if (first) {
        const installmentRows = rows.map((row, index) => ({
          transaction_id: data![index].id,
          user_id: user.id,
          installment_number: row.installment_current!,
          amount: row.amount,
          due_date: row.date,
          is_paid: row.is_paid,
          paid_at: row.is_paid ? new Date().toISOString() : null,
        }));

        await supabase.from("transaction_installments").insert(installmentRows);
      }

      await revalidateFinancePaths();
      return { success: true, data: first as Transaction };
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: values.type,
        amount: values.amount,
        account_id: values.account_id,
        category_id: values.category_id || null,
        date: values.date,
        description: baseDescription,
        notes: values.notes || null,
        payment_method: values.payment_method || null,
        is_paid: values.is_paid,
        is_recurring: isRecurring,
        installment_count: null,
        installment_current: null,
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

    await revalidateFinancePaths();
    return { success: true, data: data as Transaction };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao criar transação",
    };
  }
}

function addMonthsISO(dateISO: string, months: number) {
  const date = new Date(`${dateISO}T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

/** Divide o total em N parcelas em centavos; a última absorve o resto. */
function splitAmount(total: number, count: number): number[] {
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, index) => {
    const cents = index < remainder ? base + 1 : base;
    return cents / 100;
  });
}

export async function updateTransaction(
  id: string,
  input: TransactionInput
): Promise<ActionResult<Transaction>> {
  try {
    const parsed = transactionSchema.safeParse({
      ...input,
      recurrence:
        input.recurrence === "installment" ? "once" : input.recurrence ?? "once",
      installment_count: null,
      installment_current: null,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { supabase, user } = await requireUser();
    const values = parsed.data;

    const { data: current, error: currentError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (currentError || !current) {
      return { error: "Transação não encontrada" };
    }

    if (current.type === "transfer") {
      return { error: "Transferências não podem ser editadas por aqui" };
    }

    const result = await applySingleTransactionUpdate(
      supabase,
      user.id,
      current,
      {
        type: values.type,
        amount: values.amount,
        account_id: values.account_id,
        category_id: values.category_id || null,
        date: values.date,
        description: values.description?.trim() || null,
        notes: values.notes || null,
        payment_method: values.payment_method || null,
        is_paid: values.is_paid,
        is_recurring: values.recurrence === "fixed",
      }
    );

    if (result.error || !result.data) {
      return { error: result.error ?? "Erro ao atualizar transação" };
    }

    await revalidateFinancePaths();
    return { success: true, data: result.data };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao atualizar transação",
    };
  }
}

export type TransactionEditScope = "current" | "future" | "past" | "all";

function stripInstallmentLabel(description: string | null | undefined) {
  if (!description) return "";
  return description.replace(/\s*\(\d+\s*\/\s*\d+\)\s*$/i, "").trim();
}

function seriesFingerprint(tx: {
  type: string;
  account_id: string;
  category_id: string | null;
  amount: number | string;
  description: string | null;
}) {
  return [
    tx.type,
    tx.account_id,
    tx.category_id ?? "",
    Number(tx.amount).toFixed(2),
    (tx.description ?? "").trim().toLowerCase(),
  ].join("|");
}

async function applySingleTransactionUpdate(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  current: {
    id: string;
    type: string;
    amount: number | string;
    account_id: string;
    is_paid: boolean;
  },
  next: {
    type: "income" | "expense";
    amount: number;
    account_id: string;
    category_id: string | null;
    date: string;
    description: string | null;
    notes: string | null;
    payment_method: string | null;
    is_paid: boolean;
    is_recurring: boolean;
    installment_count?: number | null;
    installment_current?: number | null;
  }
): Promise<ActionResult<Transaction>> {
  if (current.type === "transfer") {
    return { error: "Transferências não podem ser editadas por aqui" };
  }

  if (current.is_paid) {
    await adjustAccountBalance(
      supabase,
      userId,
      current.account_id,
      -signedAmount(
        current.type as "income" | "expense",
        Number(current.amount)
      )
    );
  }

  const payload: Record<string, unknown> = {
    type: next.type,
    amount: next.amount,
    account_id: next.account_id,
    category_id: next.category_id,
    date: next.date,
    description: next.description,
    notes: next.notes,
    payment_method: next.payment_method,
    is_paid: next.is_paid,
    is_recurring: next.is_recurring,
    updated_at: new Date().toISOString(),
  };

  if (next.installment_count !== undefined) {
    payload.installment_count = next.installment_count;
  }
  if (next.installment_current !== undefined) {
    payload.installment_current = next.installment_current;
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", current.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    if (current.is_paid) {
      await adjustAccountBalance(
        supabase,
        userId,
        current.account_id,
        signedAmount(
          current.type as "income" | "expense",
          Number(current.amount)
        )
      );
    }
    return { error: error.message };
  }

  if (next.is_paid) {
    await adjustAccountBalance(
      supabase,
      userId,
      next.account_id,
      signedAmount(next.type, next.amount)
    );
  }

  return { success: true, data: data as Transaction };
}

/**
 * Edita uma ocorrência e, opcionalmente, as demais da série (fixa / parcelas).
 */
export async function updateTransactionWithScope(
  id: string,
  input: TransactionInput,
  scope: TransactionEditScope
): Promise<ActionResult<{ count: number }>> {
  try {
    const parsed = transactionSchema.safeParse({
      ...input,
      recurrence:
        input.recurrence === "installment" ? "once" : input.recurrence ?? "once",
      installment_count: null,
      installment_current: null,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { supabase, user } = await requireUser();
    const values = parsed.data;

    const { data: current, error: currentError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (currentError || !current) {
      return { error: "Transação não encontrada" };
    }

    if (current.type === "transfer") {
      return { error: "Transferências não podem ser editadas por aqui" };
    }

    const { data: allRows, error: listError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .in("type", ["income", "expense"]);

    if (listError) return { error: listError.message };

    const installmentTotal = Number(current.installment_count ?? 0);
    const isInstallmentSeries = installmentTotal >= 2;
    const isFixedSeries = Boolean(current.is_recurring);

    let series = [current];

    if (isInstallmentSeries) {
      const base = stripInstallmentLabel(current.description);
      series = (allRows ?? []).filter(
        (tx) =>
          Number(tx.installment_count) === installmentTotal &&
          tx.account_id === current.account_id &&
          tx.type === current.type &&
          stripInstallmentLabel(tx.description) === base
      );
    } else if (isFixedSeries) {
      const fingerprint = seriesFingerprint(current);
      series = (allRows ?? []).filter(
        (tx) =>
          tx.is_recurring &&
          seriesFingerprint(tx) === fingerprint
      );
    }

    const refDate = String(current.date).slice(0, 10);
    const targets = series.filter((tx) => {
      if (tx.id === current.id) return true;
      const date = String(tx.date).slice(0, 10);
      if (scope === "current") return false;
      if (scope === "future") return date >= refDate;
      if (scope === "past") return date <= refDate;
      return true;
    });

    const baseDescription =
      stripInstallmentLabel(values.description ?? "") ||
      stripInstallmentLabel(current.description);

    const keepRecurring =
      scope === "current" ? false : isFixedSeries || values.recurrence === "fixed";

    // Se "somente esta" numa série fixa e era o template, preserva a série.
    if (scope === "current" && isFixedSeries) {
      const fingerprint = seriesFingerprint(current);
      const others = series.filter((tx) => tx.id !== current.id);
      const earliest = [...series].sort((a, b) =>
        String(a.date).localeCompare(String(b.date))
      )[0];
      const editingTemplate = earliest?.id === current.id;
      const fingerprintChanged =
        seriesFingerprint({
          type: values.type,
          account_id: values.account_id,
          category_id: values.category_id || null,
          amount: values.amount,
          description: values.description?.trim() || null,
        }) !== fingerprint;

      if (editingTemplate && fingerprintChanged && others.length === 0) {
        const base = new Date(`${String(current.date).slice(0, 10)}T12:00:00`);
        base.setMonth(base.getMonth() + 1);
        const day = Number(String(current.date).slice(8, 10)) || 1;
        const lastDay = new Date(
          base.getFullYear(),
          base.getMonth() + 1,
          0
        ).getDate();
        const stubDay = Math.min(day, lastDay);
        const stubDate = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(stubDay).padStart(2, "0")}`;

        await supabase.from("transactions").insert({
          user_id: user.id,
          type: current.type,
          amount: current.amount,
          account_id: current.account_id,
          category_id: current.category_id,
          date: stubDate,
          description: current.description,
          notes: current.notes,
          payment_method: current.payment_method,
          is_paid: false,
          is_recurring: true,
          installment_count: null,
          installment_current: null,
        });
      }
    }

    let updated = 0;
    for (const member of targets) {
      const installmentCurrent = member.installment_current
        ? Number(member.installment_current)
        : null;
      const description =
        isInstallmentSeries && installmentCurrent && installmentTotal
          ? baseDescription
            ? `${baseDescription} (${installmentCurrent}/${installmentTotal})`
            : `Parcela ${installmentCurrent}/${installmentTotal}`
          : values.description?.trim() || null;

      const isPrimary = member.id === current.id;
      const result = await applySingleTransactionUpdate(
        supabase,
        user.id,
        member,
        {
          type: values.type,
          amount: values.amount,
          account_id: values.account_id,
          category_id: values.category_id || null,
          date: isPrimary ? values.date : String(member.date).slice(0, 10),
          description,
          notes: values.notes || null,
          payment_method: values.payment_method || null,
          is_paid: isPrimary ? values.is_paid : Boolean(member.is_paid),
          is_recurring: isPrimary
            ? scope === "current"
              ? false
              : values.recurrence === "fixed" || isFixedSeries
            : keepRecurring || Boolean(member.is_recurring),
          installment_count: member.installment_count,
          installment_current: member.installment_current,
        }
      );

      if (result.error) {
        return {
          error: `Falha ao atualizar uma ocorrência: ${result.error}`,
        };
      }
      updated += 1;
    }

    await revalidateFinancePaths();
    return { success: true, data: { count: updated } };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar a série de lançamentos",
    };
  }
}

/**
 * Quita a fatura do cartão. O valor sai do saldo atual no sync
 * (despesa de crédito paga reduz a conta principal).
 */
export async function payCreditCardInvoice(input: {
  creditAccountId: string;
  paymentAccountId: string;
  cycleStartISO: string;
  cycleEndISO: string;
}): Promise<ActionResult<{ amount: number; count: number }>> {
  try {
    const { supabase, user } = await requireUser();

    const [creditRes, paymentRes] = await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, type")
        .eq("id", input.creditAccountId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("accounts")
        .select("id, name, type")
        .eq("id", input.paymentAccountId)
        .eq("user_id", user.id)
        .single(),
    ]);

    if (creditRes.error || !creditRes.data || creditRes.data.type !== "credit") {
      return { error: "Cartão de crédito não encontrado" };
    }
    if (
      paymentRes.error ||
      !paymentRes.data ||
      paymentRes.data.type === "credit"
    ) {
      return { error: "Selecione uma conta (não cartão) para pagar a fatura" };
    }

    const { data: openExpenses, error: txError } = await supabase
      .from("transactions")
      .select("id, amount")
      .eq("user_id", user.id)
      .eq("account_id", input.creditAccountId)
      .eq("type", "expense")
      .eq("is_paid", false)
      .gte("date", input.cycleStartISO)
      .lte("date", input.cycleEndISO);

    if (txError) return { error: txError.message };

    const expenses = openExpenses ?? [];
    if (expenses.length === 0) {
      return { error: "Nenhuma despesa em aberto nesta fatura." };
    }

    const amount = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const ids = expenses.map((tx) => tx.id);
    const paidAt = new Date().toISOString();

    const { error: markError } = await supabase
      .from("transactions")
      .update({
        is_paid: true,
        updated_at: paidAt,
      })
      .in("id", ids)
      .eq("user_id", user.id);

    if (markError) return { error: markError.message };

    await revalidateFinancePaths({
      creditPaymentAccountId: input.paymentAccountId,
    });
    return { success: true, data: { amount, count: expenses.length } };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao pagar a fatura",
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

    await revalidateFinancePaths();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao excluir transação",
    };
  }
}

export async function getDashboardStats(options?: {
  year?: number;
  month?: number; // 0-11
}) {
  await Promise.all([
    syncCashBalancesFromTransactions(),
    syncCreditBalancesFromTransactions(),
  ]);

  const { supabase, user } = await requireUser();
  const now = new Date();
  const year = options?.year ?? now.getFullYear();
  const month = options?.month ?? now.getMonth();

  // Mesma base da página Transações: lista recente + fixas, depois expande o mês no cliente.
  const [accountsRes, mainRes, recurringRes] = await Promise.all([
    supabase
      .from("accounts")
      .select(
        "id, name, current_balance, color, currency, is_active, bank_name, icon, type, credit_cards(available_limit, credit_limit)"
      )
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("transactions")
      .select(
        "id, type, amount, is_paid, date, account_id, category_id, description, is_recurring, created_at, categories(id, name, color)"
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("transactions")
      .select(
        "id, type, amount, is_paid, date, account_id, category_id, description, is_recurring, created_at, categories(id, name, color)"
      )
      .eq("user_id", user.id)
      .eq("is_recurring", true)
      .order("date", { ascending: true }),
  ]);

  if (accountsRes.error) throw new Error(accountsRes.error.message);
  if (mainRes.error) throw new Error(mainRes.error.message);
  if (recurringRes.error) throw new Error(recurringRes.error.message);

  const accounts = (accountsRes.data ?? []).map((row) => {
    const linked = Array.isArray(row.credit_cards)
      ? row.credit_cards[0]
      : row.credit_cards;

    return {
      id: row.id,
      name: row.name,
      current_balance: Number(row.current_balance),
      color: row.color,
      currency: row.currency,
      is_active: row.is_active,
      bank_name: row.bank_name,
      icon: row.icon,
      type: row.type,
      available_limit: linked ? Number(linked.available_limit) : null,
      credit_limit: linked ? Number(linked.credit_limit) : null,
    };
  });

  const byId = new Map<string, RecurringExpandableTransaction>();
  for (const row of [...(recurringRes.data ?? []), ...(mainRes.data ?? [])]) {
    byId.set(row.id, row as RecurringExpandableTransaction);
  }

  const allTx = Array.from(byId.values());
  const monthTx = expandRecurringForMonth(allTx, year, month);
  const recent = allTx
    .filter((tx) => tx.type === "income" || tx.type === "expense")
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
    })
    .slice(0, 6)
    .map((tx) => {
      const raw = tx as RecurringExpandableTransaction & {
        categories?:
          | { name?: string; color?: string }
          | Array<{ name?: string; color?: string }>
          | null;
      };
      const category = Array.isArray(raw.categories)
        ? raw.categories[0]
        : raw.categories;
      return {
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        accounts: null as { name?: string } | null,
        categories: category ? { name: category.name, color: category.color } : null,
      };
    });

  const totalBalance = accounts
    .filter((account) => account.type !== "credit")
    .reduce((sum, account) => sum + Number(account.current_balance), 0);

  // Mesmas fórmulas da página Transações.
  const income = monthTx
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const expense = monthTx
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const pendingIncome = monthTx
    .filter((tx) => tx.type === "income" && !tx.is_paid)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const pendingExpense = monthTx
    .filter((tx) => tx.type === "expense" && !tx.is_paid)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const projectedBalance = totalBalance + pendingIncome - pendingExpense;

  const creditAccountIds = new Set(
    accounts
      .filter((account) => account.type === "credit")
      .map((account) => account.id)
  );

  const creditCardDebt = monthTx
    .filter(
      (tx) =>
        tx.type === "expense" &&
        !tx.is_paid &&
        creditAccountIds.has(tx.account_id)
    )
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  type CategoryBucket = {
    id: string;
    name: string;
    color: string;
    value: number;
  };

  function aggregateByCategory(
    type: "income" | "expense",
    fallbackColor: string
  ): CategoryBucket[] {
    const map = new Map<string, CategoryBucket>();

    for (const tx of monthTx) {
      if (tx.type !== type) continue;
      const raw = tx as RecurringExpandableTransaction & {
        categories?:
          | { id?: string; name?: string; color?: string }
          | Array<{ id?: string; name?: string; color?: string }>
          | null;
      };
      const category = Array.isArray(raw.categories)
        ? raw.categories[0]
        : raw.categories;
      const id = category?.id ?? "uncategorized";
      const name = category?.name ?? "Sem categoria";
      const color = category?.color ?? fallbackColor;
      const current = map.get(id) ?? { id, name, color, value: 0 };
      current.value += Number(tx.amount);
      map.set(id, current);
    }

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }

  return {
    totalBalance,
    projectedBalance,
    income,
    expense,
    expenseTotal: expense,
    savings: income - expense,
    creditCardDebt,
    expensesByCategory: aggregateByCategory("expense", "#ef4444"),
    incomeByCategory: aggregateByCategory("income", "#22c55e"),
    accounts,
    recent,
    monthLabel: new Date(year, month, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }),
  };
}
