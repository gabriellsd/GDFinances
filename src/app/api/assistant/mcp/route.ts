import { NextRequest, NextResponse } from "next/server";
import { getAssistantContext } from "@/lib/assistant-api";
import { GET as getSummary } from "../summary/route";
import { GET as getTransactions } from "../transactions/route";
import { GET as getResources } from "../resources/route";
import { GET as getAnalytics } from "../analytics/route";

export const dynamic = "force-dynamic";

const resourceTools = [
  ["list_financial_categories", "Lista categorias de receitas e despesas.", "categories", ["type"]],
  ["list_financial_accounts", "Lista contas bancárias, carteiras e saldos.", "accounts", ["active"]],
  ["list_credit_cards", "Lista cartões, limites, fechamento e vencimento.", "credit_cards", []],
  ["list_credit_card_bills", "Lista faturas de cartão, valores, vencimentos e pagamentos.", "credit_card_bills", ["from", "to"]],
  ["list_financial_installments", "Lista parcelas, vencimentos e situação de pagamento.", "installments", ["from", "to", "status"]],
  ["list_financial_budgets", "Lista orçamentos por categoria e mês.", "budgets", ["from", "to"]],
  ["list_financial_goals", "Lista metas financeiras e progresso acumulado.", "goals", []],
  ["list_financial_subscriptions", "Lista assinaturas, valores e datas de cobrança.", "subscriptions", ["active"]],
  ["list_financial_investments", "Lista investimentos e valores cadastrados.", "investments", []],
  ["list_financial_loans", "Lista empréstimos tomados ou concedidos e saldo devedor.", "loans", ["type"]],
  ["list_financial_transfers", "Lista transferências entre contas.", "transfers", ["from", "to"]],
  ["list_financial_tags", "Lista etiquetas usadas nos lançamentos.", "tags", []],
  ["list_credit_card_transactions", "Lista compras vinculadas a cartões e faturas.", "credit_card_transactions", ["from", "to"]],
  ["list_goal_contributions", "Lista aportes realizados em metas.", "goal_contributions", ["from", "to"]],
  ["list_investment_movements", "Lista compras, vendas, dividendos e rendimentos de investimentos.", "investment_movements", ["from", "to", "type"]],
] as const;


const analyticsTools = [
  ["get_monthly_cashflow", "Analisa receitas, despesas, valores pagos, pendências e saldo projetado por período.", "cashflow", ["from", "to"]],
  ["get_spending_by_category", "Agrupa receitas e despesas por categoria e mostra onde o dinheiro está sendo gasto.", "category", ["from", "to"]],
  ["get_recurring_expenses", "Lista despesas recorrentes no período.", "recurring", ["from", "to"]],
  ["get_upcoming_payments", "Lista despesas pendentes com vencimento no período.", "upcoming", ["from", "to"]],
  ["get_credit_card_overview", "Mostra cartões e faturas no período, com limites e vencimentos.", "cards", ["from", "to"]],
  ["get_financial_health", "Consolida saldos, investimentos, metas, dívidas, receitas e despesas para avaliar a saúde financeira.", "health", ["from", "to"]],
] as const;

const tools = [
  {
    name: "get_financial_summary",
    description: "Consulta contas ativas, receitas e despesas do mês atual e lançamentos previstos para o próximo mês.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_financial_transactions",
    description: "Lista lançamentos financeiros com filtros opcionais de data, status e tipo.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Data inicial AAAA-MM-DD." },
        to: { type: "string", description: "Data final AAAA-MM-DD." },
        status: { type: "string", enum: ["paid", "pending"] },
        type: { type: "string", enum: ["income", "expense"] },
      },
      additionalProperties: false,
    },
  },
  ...analyticsTools.map(([name, description, , filters]) => ({
    name, description,
    inputSchema: { type: "object", properties: Object.fromEntries(filters.map((filter) => [filter, { type: "string", description: "Data AAAA-MM-DD." }])), additionalProperties: false },
  })),
  ...resourceTools.map(([name, description, resource, filters]) => ({
    name,
    description,
    inputSchema: {
      type: "object",
      properties: Object.fromEntries(filters.map((filter) => [
        filter,
        filter === "status" ? { type: "string", enum: ["paid", "pending"] } :
        filter === "type" && resource === "categories" ? { type: "string", enum: ["income", "expense"] } :
        filter === "type" && resource === "loans" ? { type: "string", enum: ["borrowed", "lent"] } :
        filter === "active" ? { type: "boolean" } : { type: "string", description: "Data AAAA-MM-DD." }
      ])),
      additionalProperties: false,
    },
  })),
];

function rpc(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result }, {
    headers: { "Cache-Control": "no-store" },
  });
}

function toolResult(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    structuredContent: data,
  };
}

export async function POST(request: NextRequest) {
  const context = await getAssistantContext(request);
  if ("response" in context) {
    const resourceMetadata = `${new URL(request.url).origin}/api/assistant/mcp/oauth-protected-resource`;
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Não autorizado. Faça login via OAuth." } },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata}", scope="finance:read"`,
        },
      },
    );
  }

  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido." } },
      { status: 400 },
    );
  }

  const id = body.id ?? null;
  if (body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32600, message: "Requisição JSON-RPC inválida." } },
      { status: 400 },
    );
  }

  if (body.method.startsWith("notifications/")) return new NextResponse(null, { status: 202 });

  if (body.method === "initialize") {
    return rpc(id, {
      protocolVersion: "2025-03-26",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "gdfinances-assistant", version: "1.1.0" },
    });
  }
  if (body.method === "ping") return rpc(id, {});
  if (body.method === "tools/list") return rpc(id, { tools });

  if (body.method === "tools/call") {
    const params = body.params ?? {};
    const name = params.name;
    const args = (params.arguments ?? {}) as Record<string, unknown>;
    const origin = new URL(request.url).origin;
    const headers = new Headers();
    const authorization = request.headers.get("authorization");
    const apiKey = request.headers.get("x-api-key");
    if (authorization) headers.set("Authorization", authorization);
    if (apiKey) headers.set("X-API-Key", apiKey);

    let response: Response | null = null;
    if (name === "get_financial_summary") {
      response = (await getSummary(new NextRequest(`${origin}/api/assistant/summary`, { headers }))) ?? NextResponse.json({ error: "Falha ao consultar resumo financeiro." }, { status: 500 });
    } else if (name === "list_financial_transactions") {
      const query = new URLSearchParams();
      for (const key of ["from", "to", "status", "type"] as const) {
        const value = args[key];
        if (typeof value === "string" && value.length > 0) query.set(key, value);
      }
      response = (await getTransactions(new NextRequest(`${origin}/api/assistant/transactions?${query.toString()}`, { headers }))) ?? NextResponse.json({ error: "Falha ao consultar lançamentos." }, { status: 500 });
    } else {
      const analyticsTool = analyticsTools.find(([toolName]) => toolName === name);
      if (analyticsTool) {
        const [, , report, filters] = analyticsTool;
        const query = new URLSearchParams({ report });
        for (const key of filters) {
          const value = args[key];
          if (typeof value === "string" && value.length > 0) query.set(key, value);
        }
        response = (await getAnalytics(new NextRequest(`${origin}/api/assistant/analytics?${query.toString()}`, { headers }))) ?? NextResponse.json({ error: "Falha ao gerar análise financeira." }, { status: 500 });
      }
      const resourceTool = resourceTools.find(([toolName]) => toolName === name);
      if (resourceTool) {
        const [, , resource, filters] = resourceTool;
        const query = new URLSearchParams({ resource });
        for (const key of filters) {
          const value = args[key];
          if (typeof value === "string" || typeof value === "boolean") query.set(key, String(value));
        }
        response = (await getResources(new NextRequest(`${origin}/api/assistant/resources?${query.toString()}`, { headers }))) ?? NextResponse.json({ error: "Falha ao consultar recursos financeiros." }, { status: 500 });
      }
    }

    if (!response) return rpc(id, { content: [{ type: "text", text: "Ferramenta não encontrada." }], isError: true });
    const data = await response.json().catch(() => ({ error: "Resposta inválida da API financeira." }));
    if (!response.ok) return rpc(id, { content: [{ type: "text", text: JSON.stringify(data) }], isError: true });
    return rpc(id, toolResult(data));
  }

  return NextResponse.json(
    { jsonrpc: "2.0", id, error: { code: -32601, message: "Método não encontrado." } },
    { status: 404 },
  );
}
