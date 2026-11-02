import { NextRequest, NextResponse } from "next/server";
import { getAssistantContext } from "@/lib/assistant-api";

export const dynamic = "force-dynamic";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const money = (v: unknown) => Number(v ?? 0);

export async function GET(request: NextRequest) {
  const context = await getAssistantContext(request);
  if ("response" in context) return context.response;
  const { supabase, user } = context;
  const url = new URL(request.url);
  const report = url.searchParams.get("report");
  const today = new Date();
  const defaultStart = report === "upcoming"
    ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1))
    : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const defaultEnd = report === "upcoming"
    ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 0))
    : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  const start = url.searchParams.get("from") || iso(defaultStart);
  const end = url.searchParams.get("to") || iso(defaultEnd);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json({ error: "Datas devem usar AAAA-MM-DD." }, { status: 400 });
  }

  if (report === "cashflow" || report === "category" || report === "recurring" || report === "upcoming") {
    let query = supabase.from("transactions")
      .select("id,type,amount,date,description,is_paid,is_recurring,installment_count,installment_current,category_id,account_id,credit_card_id,payment_method")
      .eq("user_id", user.id).gte("date", start).lte("date", end)
      .order("date", { ascending: true }).limit(2000);
    if (report === "recurring") query = query.eq("is_recurring", true);
    if (report === "upcoming") query = query.eq("is_paid", false);
    const [{ data, error }, { data: categories }] = await Promise.all([
      query,
      supabase.from("categories").select("id,name,type").eq("user_id", user.id),
    ]);
    if (error) return NextResponse.json({ error: "Falha ao gerar relatório." }, { status: 500 });
    const rows = data ?? [];
    const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
    if (report === "category") {
      const grouped = new Map<string, { category: string; income: number; expense: number; count: number }>();
      for (const row of rows) {
        const key = row.category_id ?? "uncategorized";
        const item = grouped.get(key) ?? { category: categoryMap.get(key) ?? "Sem categoria", income: 0, expense: 0, count: 0 };
        if (row.type === "income") item.income += money(row.amount);
        if (row.type === "expense") item.expense += money(row.amount);
        item.count++;
        grouped.set(key, item);
      }
      return NextResponse.json({ report, period: { from: start, to: end }, categories: [...grouped.values()].sort((a,b) => b.expense-a.expense) });
    }
    if (report === "cashflow") {
      const income = rows.filter(r => r.type === "income").reduce((s,r) => s + money(r.amount), 0);
      const expenses = rows.filter(r => r.type === "expense").reduce((s,r) => s + money(r.amount), 0);
      const paid = rows.filter(r => r.type === "expense" && r.is_paid).reduce((s,r) => s + money(r.amount), 0);
      const pending = rows.filter(r => r.type === "expense" && !r.is_paid).reduce((s,r) => s + money(r.amount), 0);
      return NextResponse.json({ report, period: { from: start, to: end }, income, expenses, paidExpenses: paid, pendingExpenses: pending, projectedBalance: income-expenses, transactionCount: rows.length });
    }
    return NextResponse.json({ report, period: { from: start, to: end }, count: rows.length, items: rows });
  }

  if (report === "cards") {
    const [{ data: cards, error }, { data: bills }] = await Promise.all([
      supabase.from("credit_cards").select("id,name,bank_name,brand,credit_limit,available_limit,closing_day,due_day,card_last_four").eq("user_id", user.id),
      supabase.from("credit_card_bills").select("id,credit_card_id,reference_month,due_date,total_amount,paid_amount,status").eq("user_id", user.id).gte("due_date", start).lte("due_date", end).order("due_date").limit(500),
    ]);
    if (error) return NextResponse.json({ error: "Falha ao consultar cartões." }, { status: 500 });
    return NextResponse.json({ report, cards: cards ?? [], bills: bills ?? [] });
  }

  if (report === "health") {
    const [{ data: accounts }, { data: tx }, { data: goals }, { data: loans }, { data: investments }] = await Promise.all([
      supabase.from("accounts").select("current_balance,is_active").eq("user_id", user.id).eq("is_active", true),
      supabase.from("transactions").select("type,amount,is_paid,date").eq("user_id", user.id).gte("date", start).lte("date", end).limit(2000),
      supabase.from("goals").select("target_amount,current_amount").eq("user_id", user.id),
      supabase.from("loans").select("direction,balance").eq("user_id", user.id),
      supabase.from("investments").select("amount").eq("user_id", user.id),
    ]);
    const sum = <T,>(items: T[] | null, getValue: (item: T) => unknown) => (items ?? []).reduce((total, item) => total + money(getValue(item)), 0);
    return NextResponse.json({
      report, period: { from: start, to: end },
      accountBalances: sum(accounts, item => item.current_balance),
      investmentValue: sum(investments, item => item.amount),
      goalTarget: sum(goals, item => item.target_amount),
      goalSaved: sum(goals, item => item.current_amount),
      borrowedDebt: (loans ?? []).filter(x => x.direction === "borrowed").reduce((s,x) => s+money(x.balance),0),
      lentReceivable: (loans ?? []).filter(x => x.direction === "lent").reduce((s,x) => s+money(x.balance),0),
      income: (tx ?? []).filter(x => x.type === "income").reduce((s,x) => s+money(x.amount),0),
      expenses: (tx ?? []).filter(x => x.type === "expense").reduce((s,x) => s+money(x.amount),0),
      pendingExpenses: (tx ?? []).filter(x => x.type === "expense" && !x.is_paid).reduce((s,x) => s+money(x.amount),0),
    });
  }

  return NextResponse.json({ error: "Relatório inválido.", available: ["cashflow","category","recurring","upcoming","cards","health"] }, { status: 400 });
}
