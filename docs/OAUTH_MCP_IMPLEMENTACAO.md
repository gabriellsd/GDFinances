# OAuth 2.1 para GDFinances MCP

Status: **implementação inicial commitada; depende de secrets e Supabase Preview isolado para build/runtime e testes de ponta a ponta. Não está liberada para produção.**

## O que foi implementado na branch

- Migration `20261030090000_chatgpt_oauth_authorization_server.sql` com tabelas de clientes, códigos, consentimentos e refresh tokens.
- RLS habilitado; tabelas OAuth sem acesso de `anon`/`authenticated`; acesso backend via `service_role`.
- Função SQL `rotate_oauth_refresh_token` para rotação transacional e detecção de replay.
- Discovery OAuth em `/.well-known/oauth-authorization-server`.
- JWKS público em `/.well-known/jwks.json`.
- Protected Resource Metadata em `/api/assistant/mcp/oauth-protected-resource`.
- Registro dinâmico de clientes públicos em `/oauth/register`.
- Authorization Code + PKCE S256 e consentimento autenticado em `/oauth/authorize`.
- Troca de código e refresh em `/oauth/token`.
- Revogação de refresh token em `/oauth/revoke`.
- Access tokens RS256, audience-bound ao MCP, scope `finance:read`, TTL de 10 minutos.
- MCP valida assinatura, issuer, audience, expiração e scope e mantém suporte à API Key existente e a sessões Supabase.
- Rotas financeiras são chamadas com o usuário do token; o backend usa service-role somente após validar o JWT e as rotas de dados precisam filtrar explicitamente `user_id`.

## Secrets necessários (somente Vercel Preview)

Configure estes valores como Environment Variables no ambiente **Preview**:

- `SUPABASE_SERVICE_ROLE_KEY`: service role key do projeto Supabase de Preview isolado.
- `OAUTH_ISSUER`: origem HTTPS estável do alias Preview, sem barra final, por exemplo `https://gdfinances-git-feat-chatgpt-finance-api-gabriellsds-projects.vercel.app`.
- `OAUTH_JWT_KEY_ID`: identificador público da chave, por exemplo `gdfinances-preview-1`.
- `OAUTH_JWT_PRIVATE_KEY`: chave RSA privada PEM (secret).
- `OAUTH_JWT_PUBLIC_KEY`: chave RSA pública PEM correspondente.

Gere um par RSA dedicado para Preview. Não reutilize a chave de produção. Nunca coloque a chave privada em `NEXT_PUBLIC_*`, Git, chat ou browser. O código aceita PEM com quebras de linha escapadas como `\\n`.

## Migration / banco

**Não execute a migration no projeto Supabase que aparece como `main — PRODUCTION`.** Primeiro crie ou selecione um projeto Supabase isolado para Preview e configure as variáveis Vercel Preview para esse projeto. Só então aplique a migration nesse banco de teste e valide as permissões.

## Fluxo OAuth

1. MCP devolve 401 com URL de Protected Resource Metadata e scope `finance:read`.
2. Cliente descobre o Authorization Server e registra um public client via DCR.
3. Cliente inicia `/oauth/authorize` com `response_type=code`, `state`, `resource`, `code_challenge` e `code_challenge_method=S256`.
4. Usuário autentica no GDFinances e aprova consentimento somente leitura.
5. Authorization code aleatório, de uso único, armazenado como SHA-256, expira em 5 minutos.
6. Cliente troca code + verifier + redirect URI + resource em `/oauth/token`.
7. Access token RS256 dura 10 minutos; refresh token opaco é armazenado como hash e rotacionado.
8. Reutilização de refresh token revoga a família por função SQL transacional.
9. MCP valida o token antes de qualquer ferramenta financeira.

## Limitações e verificações ainda obrigatórias

- O endpoint anuncia DCR e não anuncia Client ID Metadata Documents (`client_id_metadata_document_supported=false`). Se o cliente MCP escolhido exigir CIMD, será necessário implementá-lo ou usar um cliente com DCR.
- O login existente precisa preservar o parâmetro `next` para retornar ao consentimento após autenticação; testar esse fluxo no navegador. Se não preservar, ajustar a tela de login antes da conexão.
- Adicionar rate limiting/WAF no endpoint público de DCR e endpoints OAuth.
- Validar CSP/CSRF, callback de localhost do ChatGPT e redirects HTTPS em testes reais.
- Confirmar no código de cada rota financeira que todas as queries com service-role filtram `user_id` explicitamente. Nunca confiar em RLS quando o service-role é usado.
- Testar concorrência de refresh, replay, code replay, PKCE inválido, redirect mismatch, resource mismatch, token expirado, scope insuficiente e isolamento entre dois usuários.
- Verificar que o framework expõe os caminhos `.well-known` no build/deployment.
- Build/lint/typecheck e teste de integração ainda precisam ser executados após configurar secrets e banco Preview.

**Não conectar o ChatGPT nem considerar pronto para uso diário até completar esses testes. Não aplicar migrations, adicionar secrets ou fazer deploy de Production automaticamente.**
