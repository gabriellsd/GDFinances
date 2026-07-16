"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { signUpWithPassword } from "@/features/auth/actions";

export function RegisterForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signUpWithPassword({
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      if (result.error && !result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (result.needsEmailConfirmation) {
        toast.success("Conta criada! Confirme o e-mail para entrar.");
        setError(null);
        return;
      }

      toast.success("Conta criada com sucesso!");
      router.push("/dashboard");
      router.refresh();
    });
  }

  async function signUpWithGoogle() {
    if (!configured) {
      toast.error("Configure o Supabase primeiro — veja docs/SUPABASE.md");
      return;
    }

    try {
      setOauthPending(true);
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        toast.error(
          "Google login não disponível. Ative o provider no Supabase (docs/SUPABASE.md — Parte 5)."
        );
      }
    } finally {
      setOauthPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {!configured && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
          Supabase ainda não está ligado. Siga o guia{" "}
          <code className="text-xs">docs/SUPABASE.md</code>.
        </div>
      )}

      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Gabriel Dias"
            required
            disabled={!configured || pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            required
            disabled={!configured || pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            disabled={!configured || pending}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!configured || pending}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Criar conta
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signUpWithGoogle}
        disabled={!configured || oauthPending}
      >
        {oauthPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Continuar com Google
      </Button>

      {!configured && (
        <Button className="w-full" variant="secondary" asChild>
          <Link href="/dashboard">Abrir dashboard (preview)</Link>
        </Button>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
