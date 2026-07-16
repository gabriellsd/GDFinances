"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";

export type AuthActionResult = {
  error?: string;
  success?: boolean;
  needsEmailConfirmation?: boolean;
};

export async function signInWithPassword(
  input: LoginInput
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase ainda não está configurado. Siga o guia em docs/SUPABASE.md",
    };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { success: true };
}

export async function signUpWithPassword(
  input: RegisterInput
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase ainda não está configurado. Siga o guia em docs/SUPABASE.md",
    };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // Sem confirmação de e-mail, já existe sessão
  if (data.session) {
    return { success: true };
  }

  return {
    success: true,
    needsEmailConfirmation: true,
  };
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (normalized.includes("user already registered")) {
    return "Este e-mail já está cadastrado. Tente entrar.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar (ou desative Confirm email no Supabase para testes).";
  }
  if (normalized.includes("password")) {
    return "Senha inválida. Use pelo menos 6 caracteres.";
  }

  return message;
}
