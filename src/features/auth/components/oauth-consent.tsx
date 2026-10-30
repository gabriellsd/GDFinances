"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthorizationDetails = {
  authorization_id?: string;
  client?: { name?: string; uri?: string; logo_uri?: string };
  scope?: string;
  redirect_uri?: string;
};

export function OAuthConsent({ authorizationId }: { authorizationId: string }) {
  const router = useRouter();
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const next = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const { data, error: requestError } =
        await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (requestError || !data) {
        setError(requestError?.message ?? "Solicitação OAuth inválida ou expirada.");
      } else if ("redirect_url" in data) {
        window.location.replace(data.redirect_url);
        return;
      } else {
        setDetails(data as AuthorizationDetails);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [authorizationId, router]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const result = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (result.error) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    if (result.data?.redirect_url) {
      window.location.assign(result.data.redirect_url);
      return;
    }
    setError("Não foi possível concluir a autorização.");
    setBusy(false);
  }

  if (loading) return <main className="mx-auto flex min-h-dvh max-w-lg items-center justify-center p-6"><p className="text-sm text-muted-foreground">Carregando solicitação de acesso...</p></main>;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center justify-center p-6">
      <section className="w-full space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">GDFinances</p>
          <h1 className="text-2xl font-semibold">Autorizar acesso às suas finanças?</h1>
          <p className="text-sm text-muted-foreground">
            Um aplicativo externo está solicitando autorização para acessar sua conta do GDFinances.
          </p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>}
        {details && (
          <div className="space-y-3 rounded-xl border p-4 text-sm">
            <div><span className="text-muted-foreground">Aplicativo</span><p className="font-medium">{details.client?.name ?? "Aplicativo não identificado"}</p></div>
            {details.client?.uri && <div><span className="text-muted-foreground">Site</span><p className="break-all">{details.client.uri}</p></div>}
            <div><span className="text-muted-foreground">Permissões solicitadas</span><p className="font-medium">{details.scope || "Acesso básico"}</p></div>
            <p className="text-muted-foreground">Nesta etapa, o assistente poderá consultar seus resumos e lançamentos financeiros. Ele não poderá criar, editar, excluir ou marcar despesas como pagas.</p>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" disabled={busy || !details} onClick={() => void decide(false)} className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium disabled:opacity-50">Não autorizar</button>
          <button type="button" disabled={busy || !details} onClick={() => void decide(true)} className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? "Processando..." : "Autorizar acesso"}</button>
        </div>
      </section>
    </main>
  );
}
