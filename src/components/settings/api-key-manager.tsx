"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("ChatGPT");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/assistant/keys", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível carregar as chaves.");
      setKeys(body.keys ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar as chaves.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadKeys(); }, [loadKeys]);

  async function createKey() {
    setCreating(true);
    setError("");
    setMessage("");
    setNewKey(null);
    try {
      const response = await fetch("/api/assistant/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível criar a chave.");
      setNewKey(body.key);
      setName("ChatGPT");
      setMessage("Chave criada. Copie agora: ela não será exibida novamente.");
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar a chave.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!window.confirm("Deseja revogar esta chave? O GPT deixará de conseguir acessar sua conta.")) return;
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/assistant/keys/${id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível revogar a chave.");
      setMessage("Chave revogada com sucesso.");
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao revogar a chave.");
    } finally {
      setBusyId(null);
    }
  }

  async function copyKey(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Chave copiada.");
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione e copie a chave.");
    }
  }

  const date = (value: string | null) => value
    ? new Date(value).toLocaleDateString("pt-BR")
    : "Nunca";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">Gerencie o acesso do seu assistente financeiro ao GDFinances.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <CardTitle className="text-base">Acesso do ChatGPT</CardTitle>
          </div>
          <CardDescription>Crie uma chave exclusiva para conectar seu GPT à sua conta financeira.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da chave (ex.: ChatGPT)" maxLength={60} />
            <Button onClick={createKey} disabled={creating || !name.trim()} className="shrink-0">
              <Plus className="size-4" /> {creating ? "Gerando..." : "Gerar chave"}
            </Button>
          </div>

          {newKey && (
            <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4" /> Sua nova chave</div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={newKey} className="font-mono text-xs" />
                <Button variant="outline" onClick={() => void copyKey(newKey)}><Copy className="size-4" /> Copiar</Button>
              </div>
              <p className="text-xs text-muted-foreground">Guarde esta chave em local seguro. Por segurança, ela não poderá ser consultada novamente nesta tela.</p>
            </div>
          )}

          {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Chaves cadastradas</CardTitle>
            <CardDescription>Revogue imediatamente qualquer chave que não queira mais utilizar.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => void loadKeys()} disabled={loading} aria-label="Atualizar lista">
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Carregando chaves...</p> :
            keys.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma chave criada ainda.</p> :
            <div className="divide-y divide-border">
              {keys.map((key) => (
                <div key={key.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      <Badge variant={key.revoked_at ? "destructive" : "secondary"}>{key.revoked_at ? "Revogada" : "Ativa"}</Badge>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{key.key_prefix}••••••••</p>
                    <p className="text-xs text-muted-foreground">Criada em {date(key.created_at)} · Último uso: {date(key.last_used_at)}</p>
                  </div>
                  {!key.revoked_at && (
                    <Button variant="destructive" size="sm" onClick={() => void revokeKey(key.id)} disabled={busyId === key.id}>
                      <Trash2 className="size-4" /> {busyId === key.id ? "Revogando..." : "Revogar"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">A chave é armazenada somente como hash no banco de dados. Nunca compartilhe sua chave em conversas ou capturas de tela.</p>
    </div>
  );
}
