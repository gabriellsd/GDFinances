import { NextRequest, NextResponse } from "next/server";
import { getAssistantContext } from "@/lib/assistant-api";
import { GET as getSummary } from "../summary/route";
import { GET as getTransactions } from "../transactions/route";

export const dynamic = "force-dynamic";

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
          "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata}"`,
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

  if (body.method === "notifications/initialized" || body.method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202 });
  }

  if (body.method === "initialize") {
    return rpc(id, {
      protocolVersion: "2025-03-26",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "gdfinances-assistant", version: "1.0.0" },
    });
  }

  if (body.method === "ping") return rpc(id, {});

  if (body.method === "tools/list") {
    return rpc(id, { tools });
  }

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

    let response: Response;
    if (name === "get_financial_summary") {
      const result = await getSummary(new NextRequest(`${origin}/api/assistant/summary`, { headers }));
      if (!result) return rpc(id, { content: [{ type: "text", text: "A consulta não retornou resposta." }], isError: true });
      response = result;
    } else if (name === "list_financial_transactions") {
      const query = new URLSearchParams();
      for (const key of ["from", "to", "status", "type"] as const) {
        const value = args[key];
        if (typeof value === "string" && value.length > 0) query.set(key, value);
      }
      const result = await getTransactions(new NextRequest(`${origin}/api/assistant/transactions?${query.toString()}`, { headers }));
      if (!result) return rpc(id, { content: [{ type: "text", text: "A consulta não retornou resposta." }], isError: true });
      response = result;
    } else {
      return rpc(id, {
        content: [{ type: "text", text: "Ferramenta não encontrada." }],
        isError: true,
      });
    }

    const data = await response.json().catch(() => ({ error: "Resposta inválida da API financeira." }));
    if (!response.ok) {
      return rpc(id, {
        content: [{ type: "text", text: JSON.stringify(data) }],
        isError: true,
      });
    }
    return rpc(id, toolResult(data));
  }

  return NextResponse.json(
    { jsonrpc: "2.0", id, error: { code: -32601, message: "Método não encontrado." } },
    { status: 404 },
  );
}
