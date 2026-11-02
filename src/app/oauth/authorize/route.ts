import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { oauthAdmin, randomToken, hashToken, AUTH_CODE_TTL, mcpResource, isSafeRedirectUri, OAUTH_SCOPE, OAUTH_SUPPORTED_SCOPES, oauthIssuer } from "@/lib/oauth-server";
export const dynamic = "force-dynamic";
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));
function page(title: string, body: string, status = 200) {
  return new NextResponse(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><body style="font:16px system-ui;max-width:560px;margin:8vh auto;padding:24px;color:#171717"><h1>${title}</h1>${body}</body></html>`, { status, headers: { "Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store" } });
}
async function userId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
function validate(p: URLSearchParams) {
  const clientId = p.get("client_id") || "", redirect = p.get("redirect_uri") || "", challenge = p.get("code_challenge") || "";
  const requestedScopes = (p.get("scope") || OAUTH_SCOPE).trim().split(/\s+/).filter(Boolean);
  const uniqueScopes = [...new Set(requestedScopes)];
  const supportedScopes = new Set<string>(OAUTH_SUPPORTED_SCOPES);
  const validScope = uniqueScopes.length === requestedScopes.length
    && uniqueScopes.includes(OAUTH_SCOPE)
    && uniqueScopes.every(scope => supportedScopes.has(scope));
  if (p.get("response_type") !== "code" || p.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(challenge) || !clientId || !redirect || !isSafeRedirectUri(redirect) || p.get("resource") !== mcpResource() || !validScope || !p.get("state")) return null;
  return { clientId, redirect, challenge, state: p.get("state")!, resource: p.get("resource")!, scope: uniqueScopes.join(" ") };
}
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams, values = validate(p);
    if (!values) return page("Solicitação inválida", "<p>Os parâmetros OAuth não são válidos. Volte ao aplicativo e tente novamente.</p>", 400);
    const admin = oauthAdmin();
    const { data: client } = await admin.from("oauth_clients").select("client_id,client_name,redirect_uris").eq("client_id", values.clientId).is("disabled_at", null).maybeSingle();
    if (!client || !client.redirect_uris.includes(values.redirect)) return page("Cliente não reconhecido", "<p>O aplicativo solicitante não está registrado para este endereço de retorno.</p>", 400);
    const uid = await userId();
    if (!uid) {
      const next = `/oauth/authorize?${p.toString()}`;
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url));
    }
    const hidden = [...p.entries()].map(([k,v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join("");
    return page("Autorizar acesso ao GDFinances", `<p><strong>${esc(client.client_name)}</strong> solicita acesso aos seus dados financeiros.</p><ul><li>Consultar contas, lançamentos e cartões</li><li>Consultar faturas, parcelas e relatórios</li><li>Permissão: somente leitura (<code>finance:read</code>)</li></ul><p>O aplicativo não poderá criar, editar ou pagar lançamentos.</p><form method="post">${hidden}<button name="decision" value="approve" style="padding:12px 20px">Autorizar</button> <button name="decision" value="deny" formnovalidate style="padding:12px 20px">Negar</button></form>`);
  } catch { return page("OAuth indisponível", "<p>O serviço de autorização ainda não está configurado.</p>", 503); }
}
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== request.nextUrl.origin) return page("Solicitação bloqueada", "<p>Origem inválida.</p>", 403);
    const uid = await userId();
    if (!uid) return page("Sessão expirada", "<p>Entre no GDFinances e tente novamente.</p>", 401);
    const form = await request.formData();
    const p = new URLSearchParams();
    for (const [k,v] of form.entries()) if (typeof v === "string") p.set(k,v);
    const values = validate(p);
    if (!values) return page("Solicitação inválida", "<p>Os parâmetros OAuth não são válidos.</p>", 400);
    const admin = oauthAdmin();
    const { data: client } = await admin.from("oauth_clients").select("client_id,redirect_uris").eq("client_id", values.clientId).is("disabled_at", null).maybeSingle();
    if (!client || !client.redirect_uris.includes(values.redirect)) return page("Cliente não reconhecido", "<p>Cliente inválido.</p>", 400);
    const target = new URL(values.redirect);
    const issuer = oauthIssuer();
    if (form.get("decision") !== "approve") {
      target.searchParams.set("error","access_denied");
      target.searchParams.set("state",values.state);
      target.searchParams.set("iss", issuer);
      return NextResponse.redirect(target);
    }
    const { error: consentError } = await admin.from("oauth_consents").upsert({ user_id: uid, client_id: values.clientId, scopes: values.scope.split(" "), granted_at: new Date().toISOString(), revoked_at: null }, { onConflict: "user_id,client_id" });
    if (consentError) throw consentError;
    const code = randomToken(32);
    const { error } = await admin.from("oauth_authorization_codes").insert({ code_hash: hashToken(code), client_id: values.clientId, user_id: uid, redirect_uri: values.redirect, scope: values.scope, code_challenge: values.challenge, code_challenge_method: "S256", resource: values.resource, expires_at: new Date(Date.now()+AUTH_CODE_TTL*1000).toISOString() });
    if (error) throw error;
    target.searchParams.set("code",code);
    target.searchParams.set("state",values.state);
    // RFC 9207 issuer identification must match the issuer advertised in server metadata,
    // not the host serving this request (which may be a Vercel Preview deployment).
    target.searchParams.set("iss", issuer);
    console.info("OAuth authorization response issued", { issuerMatchesMetadata: true });
    return NextResponse.redirect(target);
  } catch (error) {
    console.error("OAuth authorization response failed", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return page("Falha na autorização", "<p>Não foi possível concluir a autorização. Tente novamente.</p>", 500);
  }
}
