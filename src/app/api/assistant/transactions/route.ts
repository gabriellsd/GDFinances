import { NextRequest, NextResponse } from "next/server";
import { getAssistantContext } from "@/lib/assistant-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getAssistantContext(request);
  if ("response" in context) return context.response;

  const { supabase, user } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");

  if ((from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}$/.test(to))) {
    return NextResponse.json({ error: "Datas devem usar o formato AAAA-MM-DD." }, { status: 400 });
  }
  if (status && !["paid", "pending"].includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }
  if (type && !["income", "expense"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }

  let query = supabase.from("transactions")
    .select("id,type,amount,date,description,notes,is_paid,is_recurring,installment_count,installment_current,account_id,category_id,payment_method")
    .eq("user_id", user.id)
    .order("date", { ascending: true })
    .limit(500);

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (status === "paid") query = query.eq("is_paid", true);
  if (status === "pending") query = query.eq("is_paid", false);
  if (type === "income" || type === "expense") query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Não foi possível consultar os lançamentos." }, { status: 500 });

  return NextResponse.json({ transactions: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
