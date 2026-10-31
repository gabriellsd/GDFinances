# Guia de integração do GDFinances com o ChatGPT (MCP)

**Status deste guia:** 30/10/2026  
**Branch documentada:** `feat/chatgpt-finance-api`  
**Estado:** servidor MCP e ferramentas de consulta implementados; autenticação compatível com o fluxo OAuth 2.1 do ChatGPT ainda não comprovada/implementada. Não considerar a integração pronta para uso até concluir a seção de pendências.

---

## 1. O que esta integração faz

O GDFinances expõe um servidor remoto MCP (Model Context Protocol). O ChatGPT pode descobrir ferramentas publicadas pelo servidor e chamá-las para consultar os dados financeiros do usuário autenticado.

Nesta etapa, as ferramentas são **somente leitura**. Não há ferramentas MCP para criar, editar, excluir, marcar como paga ou quitar transações/faturas.

Arquitetura:

1. O usuário autentica-se no mecanismo de identidade do GDFinances.
2. O ChatGPT envia uma chamada MCP para o endpoint remoto.
3. O servidor valida a credencial e identifica o usuário.
4. As consultas ao Supabase são limitadas ao `user_id` desse usuário.
5. O servidor devolve os dados ao ChatGPT, que responde em linguagem natural.

## 2. Endpoints existentes na branch

A URL base do servidor MCP é:

```text
https://SEU-DOMINIO/api/assistant/mcp
```

Preview conhecido da branch:

```text
https://gdfinances-git-feat-chatgpt-finance-api-gabriellsds-projects.vercel.app/api/assistant/mcp
```

A URL acima é o alias Preview registrado durante o desenvolvimento. Antes de usar, confirme na Vercel se ele continua apontando para o deployment atual e se o deployment está READY.

Rotas relacionadas:

| Rota | Método | Finalidade |
|---|---|---|
| `/api/assistant/mcp` | POST | Protocolo MCP: `initialize`, `ping`, `tools/list`, `tools/call` |
| `/api/assistant/mcp/oauth-protected-resource` | GET | Metadados do recurso protegido |
| `/api/assistant/summary` | GET | Resumo financeiro |
| `/api/assistant/transactions` | GET | Lançamentos com filtros |
| `/api/assistant/resources` | GET | Recursos financeiros |
| `/api/assistant/analytics` | GET | Relatórios e análises |

As quatro rotas de dados são chamadas internamente pelo endpoint MCP. Para a integração do ChatGPT, use o endpoint MCP, não as rotas internas individualmente.

## 3. Ferramentas MCP disponíveis

O catálogo no código contém 23 ferramentas:

### Resumo e lançamentos

- `get_financial_summary` — contas ativas, receitas/despesas do mês atual e lançamentos do próximo mês.
- `list_financial_transactions` — lançamentos com filtros opcionais de data, status e tipo.

### Cartões, contas e cadastros

- `list_financial_categories`
- `list_financial_accounts`
- `list_credit_cards`
- `list_credit_card_bills`
- `list_financial_installments`
- `list_financial_budgets`
- `list_financial_goals`
- `list_financial_subscriptions`
- `list_financial_investments`
- `list_financial_loans`
- `list_financial_transfers`
- `list_financial_tags`
- `list_credit_card_transactions`
- `list_goal_contributions`
- `list_investment_movements`

### Análises

- `get_monthly_cashflow`
- `get_spending_by_category`
- `get_recurring_expenses`
- `get_upcoming_payments`
- `get_credit_card_overview`
- `get_financial_health`

Os filtros disponíveis dependem da ferramenta. Quando aplicável, use datas no formato `AAAA-MM-DD`; status de parcela `paid` ou `pending`; tipo de categoria `income` ou `expense`; e `active=true|false` para contas/assinaturas.

**Atenção:** o fluxo de caixa projetado é calculado como receitas menos despesas do período. Não deve ser interpretado automaticamente como saldo bancário total, pois não inclui necessariamente o saldo inicial das contas.

## 4. Autenticação que o código implementa hoje

Arquivo principal: `src/lib/assistant-api.ts`.

O backend aceita atualmente:

1. **Token Supabase Bearer:** um access token válido de usuário, enviado como `Authorization: Bearer <token>`. O servidor valida o token com `supabase.auth.getUser()`.
2. **Chave de API GDFinances:** enviada em `X-API-Key: gdf_...` ou como Bearer quando o valor começa com `gdf_`. O backend calcula SHA-256 e valida o hash por meio da função RPC `verify_assistant_api_key`.

O usuário é identificado pela credencial validada. As consultas usam o ID desse usuário e filtram explicitamente `user_id`; não devem usar uma chave de serviço para devolver dados sem isolamento de usuário.

### O que ainda não está implementado/comprovado

A rota de metadados `/api/assistant/mcp/oauth-protected-resource` publica:

- `resource`: URL do endpoint MCP;
- `authorization_servers`: URL do issuer Supabase terminada em `/auth/v1`;
- `bearer_methods_supported: ["header"]`.

Isso **não comprova por si só** que existe um fluxo OAuth 2.1 compatível com MCP/ChatGPT. Na branch inspecionada não foram encontradas rotas próprias de autorização/token nem implementação visível de registro dinâmico de clientes ou CIMD para esse servidor.

A chave `gdf_...` é uma credencial de API estática. Não se deve presumir que a tela de conexão de MCP do ChatGPT aceite essa chave como método de autenticação. Da mesma forma, não se deve colar um access token pessoal manualmente na configuração do conector.

Para uma conexão autenticada do ChatGPT, é necessário validar e, se necessário, implementar um Authorization Server compatível com a especificação de autorização MCP e OAuth 2.1, incluindo Authorization Code + PKCE (S256), discovery, emissão/renovação de tokens e validação de issuer, audience/resource, expiração e scopes. O provedor deve ser avaliado para suportar o fluxo de cliente exigido pelo ChatGPT (CIMD ou DCR). A configuração deve emitir refresh tokens quando necessário para manter a conexão.

**Conclusão prática:** o endpoint e as ferramentas estão no código, mas não siga ainda um passo a passo de autenticação OAuth como se estivesse pronto. A integração segura com ChatGPT depende de fechar e testar essa parte.

## 5. Preparação do ambiente

### Preview

1. Abra o projeto `gdfinances` na Vercel.
2. Confirme que a branch `feat/chatgpt-finance-api` tem um deployment com estado `READY`.
3. Copie a URL do deployment/alias Preview atual.
4. Confirme que as variáveis do Supabase estão configuradas no ambiente Preview.
5. Não use a URL de Production para testar mudanças da branch.

### Variáveis de ambiente

O projeto usa as variáveis já descritas em `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

A chave de serviço, se existir no ambiente, nunca deve ser exposta ao browser nem incluída neste guia, no Git ou em mensagens. Não copie valores reais para documentação.

Para desenvolvimento local, configure `.env.local` com credenciais próprias e não faça commit desse arquivo. O ChatGPT não consegue acessar `localhost`; para testar no ChatGPT, o servidor precisa estar publicamente acessível por HTTPS ou por um túnel compatível.

## 6. Como conectar no ChatGPT — quando a autenticação OAuth estiver pronta

Os nomes das telas podem mudar. O fluxo documentado pela OpenAI atualmente é:

1. Abra o ChatGPT na web.
2. Acesse **Plugins** e selecione o botão **+**.
3. Escolha **Add custom MCP server**.
4. Informe um nome, por exemplo **GDFinances**.
5. Em **Server URL**, informe a URL HTTPS completa do endpoint MCP Preview:
   `https://SEU-PREVIEW/api/assistant/mcp`.
6. Selecione o método OAuth compatível com o Authorization Server implementado.
7. Conclua a autorização na tela de login/consentimento do GDFinances.
8. Revise o aviso de segurança e selecione **Create as a plugin**.
9. Instale/ative o app criado e confira as ferramentas detectadas.
10. Teste primeiro consultas de leitura e compare os resultados com o próprio GDFinances.

Não escolha “No authentication” para acessar dados financeiros reais. Não use um token copiado manualmente como solução permanente.

A disponibilidade do modo de conexão MCP depende do plano, da experiência de produto e das permissões do workspace. Se a opção não aparecer, confira a documentação atual da OpenAI e as políticas do workspace.

## 7. Testes técnicos antes de conectar

Faça os testes primeiro no Preview, sem dados de produção.

### 7.1 Endpoint sem credencial

Envie um POST sem cabeçalho de autenticação para:

```text
https://SEU-PREVIEW/api/assistant/mcp
```

O comportamento atual esperado é HTTP 401, com desafio `WWW-Authenticate` apontando para os metadados do recurso protegido. Isso confirma que a rota exige autenticação; não confirma que o fluxo OAuth do ChatGPT esteja completo.

### 7.2 Testes do protocolo após autenticação válida

Com uma credencial de teste válida e obtida por um fluxo autorizado, valide nesta ordem:

1. `initialize`
2. `ping`
3. `tools/list` — conferir as 23 ferramentas esperadas
4. `tools/call` com `get_financial_summary`
5. `tools/call` com `list_financial_transactions`
6. Uma ferramenta de cada grupo de recursos e análises
7. Filtros de datas, tipo e status
8. Credencial expirada, revogada ou inválida
9. Isolamento entre dois usuários de teste diferentes

Não registre access tokens, refresh tokens, chaves de API nem dados financeiros pessoais nos logs.

### 7.3 Comparação funcional

Compare os valores retornados com as telas do app para o mesmo usuário e período:

- saldo das contas;
- receitas e despesas;
- contas pendentes;
- faturas e vencimentos;
- parcelas pagas e pendentes;
- totais por categoria.

Investigue diferenças antes de considerar a integração validada. Algumas consultas têm limite de 500 itens; relatórios de transações podem ter limite de 2.000 itens. Avalie paginação se a base crescer.

## 8. Exemplos de perguntas para testar no ChatGPT

Depois que a conexão e a autenticação estiverem validadas:

- “Mostre meu resumo financeiro deste mês.”
- “Quais contas vencem no próximo mês?”
- “Liste minhas faturas de cartão e os vencimentos.”
- “Quanto gastei por categoria neste mês?”
- “Quais parcelas ainda estão pendentes?”
- “Compare minhas receitas e despesas dos últimos três meses.”
- “Mostre minhas despesas recorrentes.”
- “Qual é o total de despesas pendentes no período?”

O ChatGPT deve consultar as ferramentas; não deve inventar valores nem completar dados ausentes por suposição.

## 9. Segurança e limites desta versão

- Ferramentas MCP atuais são somente leitura.
- Consultas devem permanecer vinculadas ao usuário autenticado.
- Não compartilhar credenciais ou tokens entre usuários.
- Não usar `SUPABASE_SERVICE_ROLE_KEY` para contornar RLS ou isolamento.
- Não liberar ferramentas de escrita sem prévia, confirmação explícita, validação de autorização e idempotência.
- Pagamento de fatura/transação precisa respeitar as regras do app para saldo, cartão, fatura e parcelas.
- Testar primeiro em Preview e com dados de teste.
- Não fazer merge nem deploy em Production sem autorização explícita.

## 10. Checklist de conclusão

### Já existe no código

- [x] Endpoint MCP remoto.
- [x] Métodos `initialize`, `ping`, `tools/list` e `tools/call`.
- [x] 23 ferramentas declaradas no catálogo.
- [x] Resumo, lançamentos, recursos e análises read-only.
- [x] Validação de usuário por token Supabase ou chave API GDFinances no backend.
- [x] Filtros por usuário nas consultas financeiras.
- [x] Rota de metadados OAuth Protected Resource básica.

### Ainda precisa ser feito/validado

- [ ] Confirmar deployment Preview em estado READY.
- [ ] Definir e implementar/validar Authorization Server OAuth 2.1 compatível com MCP e ChatGPT.
- [ ] Publicar discovery metadata correta do Authorization Server.
- [ ] Implementar Authorization Code + PKCE S256 e fluxo de registro de cliente suportado (CIMD ou DCR).
- [ ] Garantir audience/resource, scopes e refresh tokens adequados.
- [ ] Validar o token emitido em cada chamada MCP.
- [ ] Testar conexão real no ChatGPT e descoberta das ferramentas.
- [ ] Testar ferramentas com dados de usuário de teste e conferir os totais.
- [ ] Documentar o fluxo OAuth final com URLs e scopes reais, depois de implementado.
- [ ] Só então considerar a integração pronta para uso diário.

---

## Referências oficiais

- [OpenAI — Connecting custom MCP servers in ChatGPT](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt)
- [OpenAI — Authentication for MCP plugins](https://developers.openai.com/plugins/build/auth)
- [OpenAI — Add a custom MCP server](https://developers.openai.com/api/docs/guides/custom-mcp-server)
- [OpenAI — MCP servers](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
- [MCP — Authorization specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization)

> Este guia descreve a implementação encontrada na branch na data indicada. Atualize as seções de autenticação e testes somente depois de validar o fluxo real de ponta a ponta.
