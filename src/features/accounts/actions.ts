"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  accountSchema,
  extractCardLastFour,
  type AccountInput,
} from "@/lib/validations/finance";
import type { Account, AccountWithCredit, CreditCardSummary } from "@/types";

export type ActionResult<T = void> = {
  success?: boolean;
  error?: string;
  data?: T;
};

type CreditCardRow = CreditCardSummary & {
  account_id: string | null;
};

function mapAccount(
  row: Account & { credit_cards?: CreditCardRow[] | CreditCardRow | null }
): AccountWithCredit {
  const linked = Array.isArray(row.credit_cards)
    ? row.credit_cards[0]
    : row.credit_cards;

  const { credit_cards, ...account } = row;
  void credit_cards;

  return {
    ...(account as Account),
    credit_card: linked
      ? {
          id: linked.id,
          credit_limit: Number(linked.credit_limit),
          available_limit: Number(linked.available_limit),
          closing_day: linked.closing_day,
          due_day: linked.due_day,
          card_last_four: linked.card_last_four,
        }
      : null,
  };
}

async function upsertCreditCardForAccount(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  accountId: string,
  input: AccountInput,
  usedOverride?: number
) {
  const used = Math.max(
    0,
    usedOverride ?? Number(input.used_amount ?? 0)
  );
  const limit = Math.max(0, Number(input.credit_limit ?? 0));
  const available = Math.max(0, limit - used);
  const lastFour = extractCardLastFour(input.card_number);

  const payload = {
    user_id: userId,
    account_id: accountId,
    name: input.name,
    bank_name: input.bank_name || null,
    color: input.color,
    credit_limit: limit,
    available_limit: available,
    closing_day: Number(input.closing_day),
    due_day: Number(input.due_day),
    card_last_four: lastFour,
  };

  const { data: existing } = await supabase
    .from("credit_cards")
    .select("id")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("credit_cards")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("credit_cards").insert(payload);
  if (error) throw new Error(error.message);
}

export async function listAccounts(): Promise<AccountWithCredit[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, credit_cards(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapAccount(row as Account & { credit_cards?: CreditCardRow[] })
  );
}

export async function createAccount(
  input: AccountInput
): Promise<ActionResult<Account>> {
  try {
    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { supabase, user } = await requireUser();
    const values = parsed.data;
    const isCredit = values.type === "credit";
    // Cartão começa zerado: fatura só sobe com despesas no crédito.
    const balance = isCredit ? 0 : Number(values.initial_balance ?? 0);
    const creditValues = isCredit
      ? { ...values, used_amount: 0 }
      : values;

    const payload = {
      user_id: user.id,
      name: values.name,
      bank_name: values.bank_name || null,
      icon: values.icon || null,
      type: values.type,
      color: values.color,
      currency: values.currency,
      initial_balance: balance,
      current_balance: balance,
      is_active: values.is_active,
    };

    const { data, error } = await supabase
      .from("accounts")
      .insert(payload)
      .select("*")
      .single();

    if (error) return { error: error.message };

    if (isCredit) {
      try {
        await upsertCreditCardForAccount(
          supabase,
          user.id,
          data.id,
          creditValues,
          0
        );
      } catch (cardError) {
        await supabase.from("accounts").delete().eq("id", data.id);
        return {
          error:
            cardError instanceof Error
              ? cardError.message
              : "Erro ao salvar dados do cartão",
        };
      }
    }

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/cards");
    return { success: true, data: data as Account };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro ao criar conta",
    };
  }
}

export async function updateAccount(
  id: string,
  input: AccountInput
): Promise<ActionResult<Account>> {
  try {
    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { supabase, user } = await requireUser();
    const values = parsed.data;

    const { data: current, error: currentError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (currentError || !current) {
      return { error: "Conta não encontrada" };
    }

    const isCredit = values.type === "credit";
    const nextInitial = isCredit
      ? Number(current.initial_balance)
      : Number(values.initial_balance ?? 0);

    let nextBalance: number;
    if (isCredit) {
      // Mantém o saldo atual; a fatura é dirigida pelas despesas.
      nextBalance = Number(current.current_balance);
    } else {
      const balanceDelta = nextInitial - Number(current.initial_balance);
      nextBalance = Number(current.current_balance) + balanceDelta;
    }

    const { data, error } = await supabase
      .from("accounts")
      .update({
        name: values.name,
        bank_name: values.bank_name || null,
        icon: values.icon || null,
        type: values.type,
        color: values.color,
        currency: values.currency,
        initial_balance: nextInitial,
        current_balance: nextBalance,
        is_active: values.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) return { error: error.message };

    if (isCredit) {
      const usedFromBalance = Math.max(0, -nextBalance);
      await upsertCreditCardForAccount(
        supabase,
        user.id,
        id,
        values,
        usedFromBalance
      );
    } else if (current.type === "credit") {
      await supabase
        .from("credit_cards")
        .delete()
        .eq("account_id", id)
        .eq("user_id", user.id);
    }

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/cards");
    return { success: true, data: data as Account };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro ao atualizar conta",
    };
  }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("account_id", id)
      .eq("user_id", user.id);

    if ((count ?? 0) > 0) {
      return {
        error:
          "Esta conta tem transações. Remova ou mova as transações antes de excluir.",
      };
    }

    await supabase
      .from("credit_cards")
      .delete()
      .eq("account_id", id)
      .eq("user_id", user.id);

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/cards");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro ao excluir conta",
    };
  }
}

/**
 * Recalcula o saldo das contas (exceto crédito) a partir do saldo inicial
 * + lançamentos pagos.
 *
 * Despesa no cartão só sai do saldo quando está paga (quitada/fatura paga).
 * Transferências "Pagamento fatura" são ignoradas aqui para não debitar em dobro.
 */
export async function syncCashBalancesFromTransactions(options?: {
  /** Conta da qual sai o pagamento das faturas de crédito. */
  creditPaymentAccountId?: string;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    const [cashRes, creditRes, txRes] = await Promise.all([
      supabase
        .from("accounts")
        .select("id, initial_balance")
        .eq("user_id", user.id)
        .neq("type", "credit")
        .order("created_at", { ascending: true }),
      supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "credit"),
      supabase
        .from("transactions")
        .select("account_id, type, amount, is_paid, description")
        .eq("user_id", user.id)
        .eq("is_paid", true)
        .in("type", ["income", "expense", "transfer"]),
    ]);

    if (cashRes.error) return { error: cashRes.error.message };
    if (creditRes.error) return { error: creditRes.error.message };
    if (txRes.error) return { error: txRes.error.message };

    const creditIds = new Set((creditRes.data ?? []).map((row) => row.id));
    const cashAccounts = cashRes.data ?? [];
    const cashIds = new Set(cashAccounts.map((row) => row.id));
    const paymentAccountId =
      options?.creditPaymentAccountId &&
      cashIds.has(options.creditPaymentAccountId)
        ? options.creditPaymentAccountId
        : (cashAccounts[0]?.id ?? null);

    const deltaByAccount = new Map<string, number>();
    let paidCreditExpenses = 0;

    for (const tx of txRes.data ?? []) {
      const amount = Number(tx.amount);

      if (creditIds.has(tx.account_id)) {
        if (tx.type === "expense") {
          paidCreditExpenses += amount;
        }
        continue;
      }

      // Pagamento de fatura já está representado pelas despesas de crédito pagas.
      if (
        tx.type === "transfer" &&
        String(tx.description ?? "").toLowerCase().startsWith("pagamento fatura")
      ) {
        continue;
      }

      const current = deltaByAccount.get(tx.account_id) ?? 0;
      if (tx.type === "income") {
        deltaByAccount.set(tx.account_id, current + amount);
      } else {
        deltaByAccount.set(tx.account_id, current - amount);
      }
    }

    // Despesas de crédito pagas saem do saldo da conta de pagamento.
    if (paymentAccountId && paidCreditExpenses > 0) {
      const current = deltaByAccount.get(paymentAccountId) ?? 0;
      deltaByAccount.set(paymentAccountId, current - paidCreditExpenses);
    }

    for (const account of cashAccounts) {
      const next =
        Number(account.initial_balance) +
        (deltaByAccount.get(account.id) ?? 0);

      await supabase
        .from("accounts")
        .update({
          current_balance: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id)
        .eq("user_id", user.id);
    }

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erro ao sincronizar saldos",
    };
  }
}

/**
 * Recalcula saldo e limite disponível dos cartões com base nas despesas/receitas
 * lançadas na conta de crédito. Sem despesas → fatura e uso zerados.
 */
export async function syncCreditBalancesFromTransactions(): Promise<
  ActionResult
> {
  try {
    const { supabase, user } = await requireUser();

    const [accountsRes, txRes] = await Promise.all([
      supabase
        .from("accounts")
        .select("id, credit_cards(id, credit_limit)")
        .eq("user_id", user.id)
        .eq("type", "credit"),
      supabase
        .from("transactions")
        .select("account_id, type, amount, is_paid")
        .eq("user_id", user.id)
        .in("type", ["expense", "income"]),
    ]);

    if (accountsRes.error) return { error: accountsRes.error.message };
    if (txRes.error) return { error: txRes.error.message };

    // No crédito, só o que ainda está "a pagar" compõe a fatura/dívida.
    const usageByAccount = new Map<string, number>();
    for (const tx of txRes.data ?? []) {
      const amount = Number(tx.amount);
      const current = usageByAccount.get(tx.account_id) ?? 0;
      if (tx.type === "expense" && !tx.is_paid) {
        usageByAccount.set(tx.account_id, current + amount);
      } else if (tx.type === "income" && tx.is_paid) {
        usageByAccount.set(tx.account_id, current - amount);
      }
    }

    for (const account of accountsRes.data ?? []) {
      const used = Math.max(0, usageByAccount.get(account.id) ?? 0);
      const linked = Array.isArray(account.credit_cards)
        ? account.credit_cards[0]
        : account.credit_cards;
      const limit = linked ? Number(linked.credit_limit) : 0;
      const available = Math.max(0, limit - used);

      await supabase
        .from("accounts")
        .update({
          current_balance: -used,
          initial_balance: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id)
        .eq("user_id", user.id);

      if (linked?.id) {
        await supabase
          .from("credit_cards")
          .update({
            available_limit: available,
          })
          .eq("id", linked.id)
          .eq("user_id", user.id);
      }
    }

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erro ao sincronizar cartões",
    };
  }
}
