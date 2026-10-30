import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("assistant_api_keys")
      .select("id,name,key_prefix,last_used_at,expires_at,revoked_at,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ keys: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível listar as chaves." }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "ChatGPT";
    if (!name) return NextResponse.json({ error: "Informe um nome para a chave." }, { status: 400 });

    const rawKey = `gdf_${randomBytes(32).toString("base64url")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const { data, error } = await supabase.from("assistant_api_keys").insert({
      user_id: user.id, name, key_hash: keyHash, key_prefix: rawKey.slice(0, 12),
    }).select("id,name,key_prefix,created_at").single();
    if (error) throw error;
    return NextResponse.json({ key: rawKey, metadata: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar a chave. Verifique se a migração do banco foi aplicada." }, { status: 400 });
  }
}
