import { NextRequest, NextResponse } from "next/server";
import { getAssistantContext } from "@/lib/assistant-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getAssistantContext(request);
  if ("response" in context) return context.response;

  const { supabase, user } = context;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  const nextMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0)).toISOString().slice(0, 10);

  const [accountsRes, currentRes, nextRes] = await Promise.all([
    supabase.from("accounts").select("id,name,type,current_balance,is_active").eq("user_id", user.id).eq("is_active", true),
    supabase.from("transactions").select("id,type,amount,date,description,is_paid,account_id,category_id,installment_count,installment_current").eq("user_id", user.id).gte("date", monthStart).lt("date", nextMonthStart).order("date", { ascending: true }).limit(500),
    supabase.from("transactions").select("id,type,amount,date,description,is_paid,account_id,category_id,installment_count,installment_current").eq("user_id", user.id).gte("date", nextMonthStart).lte("date", nextMonthEnd).order("date", { ascending: true }).limit(500),
  ]);

  const error = accountsRes.error || currentRes.error || nextRes.error;
  if (error) return NextResponse.json({ error: "Não foi possível consultar os dados financeiros." }, { status: 500 });

  const current = currentRes.data ?? [];
  const next = nextRes.data ?? [];
  const sum = (rows: typeof current, kind: string, paid?: boolean) =>
    rows.filter((row) => row.type === kind && (paid === undefined || row.is_paid === paid))
      .reduce((total, row) => total + Number(row.amount), 0);

  return NextResponse.json({
    period: { currentMonthStart: monthStart, nextMonthStart, nextMonthEnd },
    accounts: accountsRes.data ?? [],
    currentMonth: {
      income: sum(current, "income"),
      expenses: sum(current, "expense"),
      paidExpenses: sum(current, "expense", true),
      pendingExpenses: sum(current, "expense", false),
      transactions: current,
    },
    nextMonth: {
      income: sum(next, "income"),
      expenses: sum(next, "expense"),
      pendingExpenses: sum(next, "expense", false),
      transactions: next,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
