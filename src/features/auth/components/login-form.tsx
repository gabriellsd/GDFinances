"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { signInWithPassword } from "@/features/auth/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInWithPassword({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Bem-vindo de volta!");
      router.push(next);
      router.refresh();
    });
  }

  async function signInWithGoogle() {
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
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        toast.error(
          "Google login não disponível. Ative o provider Google no Supabase (docs/SUPABASE.md — Parte 5)."
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
          <code className="text-xs">docs/SUPABASE.md</code>. Enquanto isso, use o
          modo preview.
        </div>
      )}

      <form action={onSubmit} className="space-y-4">
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
            autoComplete="current-password"
            placeholder="••••••••"
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
          Entrar
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
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
        Não tem conta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
