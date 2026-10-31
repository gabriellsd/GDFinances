import { NextRequest, NextResponse } from "next/server";
import { oauthAdmin, hashToken, issueAccessToken, randomToken, REFRESH_TOKEN_TTL, mcpResource } from "@/lib/oauth-server";
import { createHash, timingSafeEqual } from "node:crypto";
export const dynamic = "force-dynamic";
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
function verifyPkce(verifier: string, challenge: string) {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  const digest = createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(digest), b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const grant = String(form.get("grant_type") || ""), clientId = String(form.get("client_id") || ""), resource = String(form.get("resource") || "");
    if (!clientId || resource !== mcpResource()) return fail("invalid_request");
    const admin = oauthAdmin();
    const { data: client } = await admin.from("oauth_clients").select("*").eq("client_id", clientId).is("disabled_at", null).maybeSingle();
    if (!client) return fail("invalid_client", 401);
    if (grant === "authorization_code") {
      const code = String(form.get("code") || ""), verifier = String(form.get("code_verifier") || ""), redirectUri = String(form.get("redirect_uri") || "");
      if (!code || !verifier || !redirectUri || !client.redirect_uris.includes(redirectUri)) return fail("invalid_grant");
      const { data: row } = await admin.from("oauth_authorization_codes").select("*").eq("code_hash", hashToken(code)).eq("client_id", clientId).eq("redirect_uri", redirectUri).eq("resource", resource).is("consumed_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
      if (!row || !verifyPkce(verifier, row.code_challenge)) return fail("invalid_grant");
      const { data: consumed } = await admin.from("oauth_authorization_codes").update({ consumed_at: new Date().toISOString() }).eq("id", row.id).is("consumed_at", null).select("id").maybeSingle();
      if (!consumed) return fail("invalid_grant");
      const { data: consent } = await admin.from("oauth_consents").select("id").eq("user_id", row.user_id).eq("client_id", clientId).is("revoked_at", null).maybeSingle();
      if (!consent) return fail("invalid_grant");
      const refresh = randomToken(48);
      const { error } = await admin.from("oauth_refresh_tokens").insert({ token_hash: hashToken(refresh), family_id: crypto.randomUUID(), user_id: row.user_id, client_id: clientId, scope: row.scope, resource, expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString() });
      if (error) throw error;
      return NextResponse.json({ access_token: issueAccessToken({ userId: row.user_id, clientId, scope: row.scope, resource }), token_type: "Bearer", expires_in: 600, refresh_token: refresh, scope: row.scope }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }
    if (grant === "refresh_token") {
      const refresh = String(form.get("refresh_token") || "");
      if (!refresh) return fail("invalid_grant");
      const { data: old } = await admin.from("oauth_refresh_tokens").select("*").eq("token_hash", hashToken(refresh)).eq("client_id", clientId).eq("resource", resource).maybeSingle();
      if (!old || old.revoked_at || Date.parse(old.expires_at) <= Date.now()) return fail("invalid_grant");
      if (old.used_at) { await admin.from("oauth_refresh_tokens").update({ revoked_at: new Date().toISOString() }).eq("family_id", old.family_id); return fail("invalid_grant"); }
      const { data: used } = await admin.from("oauth_refresh_tokens").update({ used_at: new Date().toISOString() }).eq("id", old.id).is("used_at", null).is("revoked_at", null).select("id").maybeSingle();
      if (!used) return fail("invalid_grant");
      const next = randomToken(48);
      const { error } = await admin.from("oauth_refresh_tokens").insert({ token_hash: hashToken(next), family_id: old.family_id, user_id: old.user_id, client_id: clientId, scope: old.scope, resource, expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString() });
      if (error) throw error;
      return NextResponse.json({ access_token: issueAccessToken({ userId: old.user_id, clientId, scope: old.scope, resource }), token_type: "Bearer", expires_in: 600, refresh_token: next, scope: old.scope }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }
    return fail("unsupported_grant_type");
  } catch { return fail("server_error", 500); }
}