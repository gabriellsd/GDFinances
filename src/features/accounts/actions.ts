"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { accountSchema, type AccountInput } from "@/lib/validations/finance";
import type { Account } from "@/types";

export type ActionResult<T = void> = {
  success?: boolean;
  error?: string;
  data?: T;
};

export async function listAccounts(): Promise<Account[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Account[];
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
    const payload = {
      user_id: user.id,
      name: parsed.data.name,
      bank_name: parsed.data.bank_name || null,
      icon: parsed.data.icon || null,
      type: parsed.data.type,
      color: parsed.data.color,
      currency: parsed.data.currency,
      initial_balance: parsed.data.initial_balance,
      current_balance: parsed.data.initial_balance,
      is_active: parsed.data.is_active,
    };

    const { data, error } = await supabase
      .from("accounts")
      .insert(payload)
      .select("*")
      .single();

    if (error) return { error: error.message };

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
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

    const { data: current, error: currentError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (currentError || !current) {
      return { error: "Conta não encontrada" };
    }

    const balanceDelta =
      parsed.data.initial_balance - Number(current.initial_balance);
    const nextBalance = Number(current.current_balance) + balanceDelta;

    const { data, error } = await supabase
      .from("accounts")
      .update({
        name: parsed.data.name,
        bank_name: parsed.data.bank_name || null,
        icon: parsed.data.icon || null,
        type: parsed.data.type,
        color: parsed.data.color,
        currency: parsed.data.currency,
        initial_balance: parsed.data.initial_balance,
        current_balance: nextBalance,
        is_active: parsed.data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) return { error: error.message };

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
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

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro ao excluir conta",
    };
  }
}
