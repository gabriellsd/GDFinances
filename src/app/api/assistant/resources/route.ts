import { NextRequest, NextResponse } from "next/server";
import { getAssistantContext } from "@/lib/assistant-api";

export const dynamic = "force-dynamic";

const resources = {
  categories: { table: "categories", select: "id,name,type,parent_id,icon,color,monthly_limit,created_at", order: "name" },
  accounts: { table: "accounts", select: "id,name,bank_name,type,color,currency,initial_balance,current_balance,is_active,created_at", order: "name" },
  credit_cards: { table: "credit_cards", select: "id,name,bank_name,brand,color,credit_limit,available_limit,closing_day,due_day,best_day,card_last_four,account_id,created_at", order: "name" },
  credit_card_bills: { table: "credit_card_bills", select: "id,credit_card_id,reference_month,closing_date,due_date,total_amount,paid_amount,status,created_at", order: "due_date" },
  installments: { table: "transaction_installments", select: "id,transaction_id,installment_number,amount,due_date,is_paid,paid_at", order: "due_date" },
  budgets: { table: "budgets", select: "id,category_id,month,amount,spent,created_at", order: "month" },
  goals: { table: "goals", select: "id,name,target_amount,current_amount,target_date,icon,color,created_at", order: "target_date" },
  subscriptions: { table: "subscriptions", select: "id,category_id,name,amount,billing_day,renewal_date,is_active,created_at", order: "name" },
  investments: { table: "investments", select: "id,name,type,amount,profitability,institution,created_at", order: "name" },
  loans: { table: "loans", select: "id,counterparty,direction,principal,interest_rate,installment_count,balance,created_at", order: "created_at" },
  transfers: { table: "transfers", select: "id,from_account_id,to_account_id,amount,date,description,created_at", order: "date" },
  tags: { table: "tags", select: "id,name,color,created_at", order: "name" },
  credit_card_transactions: { table: "credit_card_transactions", select: "id,bill_id,credit_card_id,transaction_id,amount,description,purchase_date,created_at", order: "purchase_date" },
  goal_contributions: { table: "goal_contributions", select: "id,goal_id,amount,date,notes,created_at", order: "date" },
  investment_movements: { table: "investment_movements", select: "id,investment_id,type,amount,date,created_at", order: "date" },
} as const;

type ResourceName = keyof typeof resources;

export async function GET(request: NextRequest) {
  const context = await getAssistantContext(request);
  if ("response" in context) return context.response;

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") as ResourceName | null;
  if (!resource || !(resource in resources)) {
    return NextResponse.json({ error: "Recurso inválido.", available: Object.keys(resources) }, { status: 400 });
  }

  const config = resources[resource];
  let query = context.supabase.from(config.table).select(config.select)
    .eq("user_id", context.user.id)
    .order(config.order, { ascending: true })
    .limit(500);

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  if ((from && !/^\\d{4}-\\d{2}-\\d{2}$/.test(from)) || (to && !/^\\d{4}-\\d{2}-\\d{2}$/.test(to))) {
    return NextResponse.json({ error: "Datas devem usar o formato AAAA-MM-DD." }, { status: 400 });
  }
  if (["credit_card_bills", "installments", "transfers", "credit_card_transactions", "goal_contributions", "investment_movements"].includes(resource)) {
    if (from) query = query.gte(resource === "credit_card_bills" ? "due_date" : resource === "installments" ? "due_date" : resource === "credit_card_transactions" ? "purchase_date" : "date", from);
    if (to) query = query.lte(resource === "credit_card_bills" ? "due_date" : resource === "installments" ? "due_date" : resource === "credit_card_transactions" ? "purchase_date" : "date", to);
  }
  if (resource === "installments" && status === "paid") query = query.eq("is_paid", true);
  if (resource === "installments" && status === "pending") query = query.eq("is_paid", false);
  if (resource === "categories" && (type === "income" || type === "expense")) query = query.eq("type", type);
  if (resource === "investment_movements" && type) query = query.eq("type", type);
  if (resource === "loans" && (type === "borrowed" || type === "lent")) query = query.eq("direction", type);
  if (resource === "accounts" || resource === "subscriptions") {
    const active = url.searchParams.get("active");
    if (active === "true" || active === "false") query = query.eq("is_active", active === "true");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Não foi possível consultar o recurso financeiro." }, { status: 500 });
  return NextResponse.json({ resource, count: data?.length ?? 0, items: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
