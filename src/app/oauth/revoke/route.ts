import { NextRequest, NextResponse } from "next/server";
import { oauthAdmin, hashToken } from "@/lib/oauth-server";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const token = String(form.get("token") || "");
    if (!token) return new NextResponse(null,{status:200});
    const admin = oauthAdmin();
    const { data } = await admin.from("oauth_refresh_tokens").select("family_id").eq("token_hash",hashToken(token)).maybeSingle();
    if (data) await admin.from("oauth_refresh_tokens").update({revoked_at:new Date().toISOString()}).eq("family_id",data.family_id);
    return new NextResponse(null,{status:200,headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"server_error"},{status:500}); }
}