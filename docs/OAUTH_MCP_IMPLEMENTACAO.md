# OAuth 2.1 para GDFinances MCP — plano de implementação

Status: **fundação de banco preparada; fluxo OAuth ainda não está ativo**.

## Segurança e escopo

- Preservar `assistant_api_keys` e `verify_assistant_api_key` sem alterações.
- Manter o MCP read-only com o scope `finance:read`.
- Não usar a chave `SUPABASE_SERVICE_ROLE_KEY` no browser.
- As tabelas OAuth não devem ser acessíveis diretamente por `anon` ou `authenticated`; somente pelo backend.
- Não executar migrations em Production durante desenvolvimento.

## Migration preparada

Arquivo: `supabase/migrations/20261030090000_chatgpt_oauth_authorization_server.sql`

Cria:
- `oauth_clients`: clientes públicos e redirect URIs registrados.
- `oauth_authorization_codes`: códigos de uso único armazenados como hash.
- `oauth_consents`: consentimento explícito por usuário/cliente/escopo.
- `oauth_refresh_tokens`: refresh tokens com hash, família e campos para rotação/revogação.

A migration habilita RLS e revoga privilégios de `anon` e `authenticated`, concedendo acesso apenas a `service_role`.

**A migration foi commitada na branch, mas não foi executada em nenhum banco.**

## Decisões do protocolo

1. Authorization Code + PKCE obrigatório, somente `S256`.
2. Clientes públicos: `token_endpoint_auth_method=none`.
3. Redirect URI deve corresponder exatamente a uma URI registrada.
4. O authorization code deve ser aleatório, curto, armazenado como SHA-256, expirar rapidamente e ser consumido uma única vez.
5. Access token assinado pelo GDFinances, com `iss`, `aud` (resource MCP), `sub` (user UUID), `client_id`, `scope`, `iat`, `exp` e `jti`.
6. O MCP deve validar assinatura, algoritmo permitido, issuer, audience, expiração e scope em toda chamada.
7. Refresh token aleatório opaco, armazenado somente como SHA-256, rotacionado em cada uso. Reutilização de token já consumido deve revogar a família.
8. Consentimento pode ser revogado pelo usuário.
9. Nunca aceitar scope maior que `finance:read` nesta primeira versão.

## Pendências antes de ativar

- [ ] Criar/selecionar um projeto Supabase de Preview separado de Production.
- [ ] Configurar as variáveis OAuth somente no ambiente Preview:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OAUTH_ISSUER` (URL pública estável do GDFinances)
  - `OAUTH_JWT_PRIVATE_KEY` (chave privada de assinatura, secret)
  - `OAUTH_JWT_PUBLIC_KEY` (chave pública correspondente)
  - `OAUTH_JWT_KEY_ID` (identificador da chave)
- [ ] Implementar discovery do Authorization Server e Protected Resource Metadata com issuer/resource corretos.
- [ ] Implementar registro dinâmico de clientes ou suporte explícito a Client ID Metadata Documents, conforme o fluxo exigido pelo cliente ChatGPT.
- [ ] Implementar authorization endpoint, tela de login/consentimento, token endpoint, refresh e revogação.
- [ ] Atualizar o MCP para aceitar tokens OAuth GDFinances e continuar aceitando API Keys existentes apenas se isso for intencional.
- [ ] Adicionar JWKS público e rotação de chaves.
- [ ] Testar PKCE, redirect URI maliciosa, state, code replay, refresh replay, expiração, revogação, escopo insuficiente e isolamento entre usuários.
- [ ] Confirmar que chamadas MCP sem credencial continuam 401.
- [ ] Testar tudo em Preview com dados fictícios antes de considerar qualquer ativação.

## Atenção sobre ambiente

O Preview da Vercel pode estar usando as mesmas variáveis Supabase de Production. Antes de executar a migration, confirmar que o Preview aponta para um projeto Supabase isolado. Não executar o SQL no projeto atualmente identificado como `main — PRODUCTION`.

A migration é uma fundação de schema, não uma implementação OAuth pronta. Não conectar o ChatGPT nem divulgar a URL como integração autenticada até todos os itens acima estarem concluídos e testados.
