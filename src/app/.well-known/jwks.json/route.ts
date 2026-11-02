import { NextResponse } from "next/server";
import { publicJwks } from "@/lib/oauth-server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(publicJwks(), { headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
  } catch {
    return NextResponse.json({ error: "JWKS indisponível." }, { status: 503 });
  }
}