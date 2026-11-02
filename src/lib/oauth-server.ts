import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, createPrivateKey, createPublicKey, randomBytes, sign, verify } from "node:crypto";
import { getSupabaseEnv } from "@/lib/supabase/config";

export const OAUTH_SCOPE = "finance:read";
export const OAUTH_OFFLINE_ACCESS_SCOPE = "offline_access";
export const OAUTH_SUPPORTED_SCOPES = [OAUTH_SCOPE, OAUTH_OFFLINE_ACCESS_SCOPE] as const;
export const ACCESS_TOKEN_TTL = 600;
export const AUTH_CODE_TTL = 300;
export const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;

export function oauthIssuer() {
  const issuer = process.env.OAUTH_ISSUER?.replace(/\/$/, "");
  if (!issuer) throw new Error("OAUTH_ISSUER não configurado.");
  return issuer;
}

export function mcpResource() {
  return `${oauthIssuer()}/api/assistant/mcp`;
}

export function oauthAdmin(): SupabaseClient {
  const env = getSupabaseEnv();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !serviceRole) throw new Error("OAuth indisponível: configure Supabase e SUPABASE_SERVICE_ROLE_KEY no servidor.");
  return createClient(env.url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function privateKey() {
  const pem = process.env.OAUTH_JWT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!pem) throw new Error("OAUTH_JWT_PRIVATE_KEY não configurada.");
  return createPrivateKey(pem);
}

function publicKey() {
  const pem = process.env.OAUTH_JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");
  if (!pem) throw new Error("OAUTH_JWT_PUBLIC_KEY não configurada.");
  return createPublicKey(pem);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function issueAccessToken(input: { userId: string; clientId: string; scope: string; resource: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "RS256", typ: "JWT", kid: process.env.OAUTH_JWT_KEY_ID || "gdfinances-2026-1" });
  const payload = encode({
    iss: oauthIssuer(), sub: input.userId, aud: input.resource,
    client_id: input.clientId, scope: input.scope, iat: now,
    exp: now + ACCESS_TOKEN_TTL, jti: randomToken(16),
  });
  const data = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(data), privateKey()).toString("base64url");
  return `${data}.${signature}`;
}

export function verifyAccessToken(token: string, expectedResource: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (header.alg !== "RS256" || header.kid !== (process.env.OAUTH_JWT_KEY_ID || "gdfinances-2026-1")) return null;
    if (!verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), publicKey(), Buffer.from(parts[2], "base64url"))) return null;
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== oauthIssuer() || claims.aud !== expectedResource || !claims.sub || !claims.client_id) return null;
    if (!Number.isInteger(claims.exp) || claims.exp <= now || !Number.isInteger(claims.iat) || claims.iat > now + 60) return null;
    if (typeof claims.scope !== "string" || !claims.scope.split(" ").includes(OAUTH_SCOPE)) return null;
    return claims as { sub: string; client_id: string; scope: string; exp: number; aud: string; iss: string };
  } catch {
    return null;
  }
}

export function publicJwks() {
  const jwk = publicKey().export({ format: "jwk" });
  return {
    keys: [{
      ...jwk, use: "sig", alg: "RS256", kid: process.env.OAUTH_JWT_KEY_ID || "gdfinances-2026-1",
    }],
  };
}

export function isSafeRedirectUri(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]");
  } catch {
    return false;
  }
}
