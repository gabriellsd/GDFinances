"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { categorySchema, type CategoryInput } from "@/lib/validations/finance";
import type { Category } from "@/types";
import type { ActionResult } from "@/features/accounts/actions";

export async function listCategories(
  type?: "income" | "expense"
): Promise<Category[]> {
  const { supabase, user } = await requireUser();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function createCategory(
  input: CategoryInput
): Promise<ActionResult<Category>> {
  try {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        type: parsed.data.type,
        color: parsed.data.color,
        icon: parsed.data.icon ?? null,
        monthly_limit: parsed.data.monthly_limit ?? null,
      })
      .select("*")
      .single();

    if (error) return { error: error.message };

    revalidatePath("/categories");
    revalidatePath("/transactions");
    return { success: true, data: data as Category };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao criar categoria",
    };
  }
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<ActionResult<Category>> {
  try {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("categories")
      .update({
        name: parsed.data.name,
        type: parsed.data.type,
        color: parsed.data.color,
        icon: parsed.data.icon ?? null,
        monthly_limit: parsed.data.monthly_limit ?? null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) return { error: error.message };

    revalidatePath("/categories");
    revalidatePath("/transactions");
    return { success: true, data: data as Category };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao atualizar categoria",
    };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/categories");
    revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao excluir categoria",
    };
  }
}
