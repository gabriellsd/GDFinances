import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("assistant_api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", user.id).is("revoked_at", null);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível revogar a chave." }, { status: 400 });
  }
}
