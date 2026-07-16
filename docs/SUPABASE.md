# Guia Supabase — GDFinances

Este guia é para quem **nunca usou o Supabase**. Siga na ordem. Não precisa instalar nada no PC: tudo é feito no navegador.

---

## O que é o Supabase? (em 30 segundos)

O Supabase é um “backend pronto” na nuvem. No GDFinances ele cuida de:

| Serviço | Para que serve no app |
|---------|------------------------|
| **Auth** | Login, cadastro, Google, sessões (JWT) |
| **PostgreSQL** | Banco de dados (contas, despesas, metas…) |
| **Storage** | Arquivos (comprovantes, anexos) |
| **RLS** | Segurança: cada usuário só vê **os próprios** dados |

Você cria um projeto gratuito → copia 2 chaves → cola no `.env.local` → cola o SQL no painel → pronto.

---

## Parte 1 — Criar conta e projeto

### 1.1 Criar conta
1. Abra: [https://supabase.com](https://supabase.com)
2. Clique em **Start your project** / **Sign in**
3. Entre com GitHub ou e-mail (o que preferir)

### 1.2 Criar o projeto
1. No dashboard, clique em **New project**
2. Preencha:
   - **Name:** `GDFinances` (ou qualquer nome)
   - **Database Password:** invente uma senha **forte** e **guarde** (você pode precisar depois). Não é a senha de login do app.
   - **Region:** escolha a mais perto (ex.: `South America (São Paulo)` se aparecer)
3. Clique em **Create new project**
4. Espere 1–2 minutos até o status ficar **Active** (verde)

> Enquanto provisiona, o painel pode mostrar “Setting up project…”. Aguarde.

---

## Parte 2 — Copiar as chaves (API)

1. No menu lateral esquerdo, vá em **Project Settings** (ícone de engrenagem)
2. Clique em **API** (ou **Data API**)
3. Você verá algo assim:

| Campo no painel | O que colar no app |
|-----------------|--------------------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` — deve ser `https://xxxxx.supabase.co` |
| **anon public** (chave) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` — costuma começar com `eyJ...` |

> **Erro comum:** colar a chave `sb_publishable_...` ou a anon key no campo da **URL**.  
> A URL **sempre** começa com `https://` e termina com `.supabase.co`.

4. Abra o arquivo `.env.local` na raiz do GDFinances e preencha:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. **Salve** o arquivo
6. Se o `npm run dev` já estiver rodando, **pare** (Ctrl+C) e rode de novo:

```bash
npm run dev
```

> A chave **service_role** é secreta e **não** vai no frontend. Só usamos depois, se precisar de scripts admin. Por enquanto ignore.

---

## Parte 3 — Criar as tabelas (SQL)

É aqui que o banco do GDFinances nasce.

### 3.1 Abrir o SQL Editor
1. No menu lateral: **SQL Editor**
2. Clique em **New query** (nova consulta)

### 3.2 Colar a migration
1. No seu computador, abra o arquivo:

`supabase/migrations/20260716120000_init.sql`

2. Selecione **tudo** (Ctrl+A) e copie (Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou Ctrl+Enter)

### 3.2.1 Se der erro “already exists” (tipo ou tabela)

Isso é normal se o script rodou **pela metade** ou **duas vezes**.

Faça assim:

1. Abra o arquivo `supabase/RESET_BEFORE_INIT.sql`
2. Cole tudo no SQL Editor → **Run**
3. Você deve ver a mensagem: `Reset concluído...`
4. Depois rode de novo o `20260716120000_init.sql`

> O reset **não apaga** seus usuários de login (Auth). Só limpa as tabelas do GDFinances para recriar limpo.

### 3.3 Conferir se deu certo
1. Menu lateral → **Table Editor**
2. Você deve ver tabelas como: `profiles`, `accounts`, `categories`, `transactions`, `goals`, etc.

Se aparecer erro vermelho:
- Leia a mensagem
- Se for “already exists”, use o reset acima
- Me envie o texto do erro se for outra mensagem

---

## Parte 4 — Configurar autenticação (e-mail)

### 4.1 Ativar cadastro por e-mail
1. Menu: **Authentication** → **Providers**
2. Abra **Email**
3. Deixe **Enable Email provider** ligado
4. Opções recomendadas no início:
   - **Confirm email:** pode deixar **desligado** enquanto testa (assim você entra sem precisar clicar no e-mail)
   - Quando for usar de verdade, ligue de novo

### 4.2 URL de redirecionamento (obrigatório para login funcionar bem)
1. **Authentication** → **URL Configuration**
2. Em **Site URL**, coloque:

```text
http://localhost:3000
```

3. Em **Redirect URLs**, adicione (uma por linha ou pelo botão Add):

```text
http://localhost:3000/auth/callback
http://localhost:3000/**
```

4. Salve

---

## Parte 5 — (Opcional) Login com Google

Só faça se quiser o botão “Continuar com Google” funcionando.

1. **Authentication** → **Providers** → **Google** → Enable
2. O Supabase pede **Client ID** e **Client Secret** do Google Cloud
3. Guia oficial: [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)

Se preferir, deixamos Google para depois e usamos só e-mail/senha.

---

## Parte 6 — Testar no GDFinances

1. Com `.env.local` preenchido e `npm run dev` rodando
2. Abra: [http://localhost:3000/register](http://localhost:3000/register)
3. Crie uma conta com seu e-mail e uma senha (mín. 6 caracteres)
4. Você deve cair no **Dashboard**
5. No Supabase: **Authentication** → **Users** → deve aparecer seu usuário
6. Em **Table Editor** → `profiles` → deve ter uma linha com seu nome

---

## Checklist rápido

- [ ] Projeto criado e Active
- [ ] URL + anon key no `.env.local`
- [ ] SQL da migration executado
- [ ] Tabelas visíveis no Table Editor
- [ ] Site URL = `http://localhost:3000`
- [ ] Redirect URL com `/auth/callback`
- [ ] Conta criada pelo app e usuário aparece no Auth

---

## Problemas comuns

### “Invalid API key” / não conecta
- Conferir se copiou a chave **anon** (não a service_role)
- Sem aspas extras, sem espaço no fim
- Reiniciar o `npm run dev`

### Cadastra mas não redireciona / loop de login
- Conferir Redirect URLs (Parte 4.2)
- Limpar cookies do `localhost:3000` e tentar de novo

### “Email not confirmed”
- Em Providers → Email, desative **Confirm email** para testes

### Rodei o SQL duas vezes / “type already exists”
1. Rode `supabase/RESET_BEFORE_INIT.sql` no SQL Editor
2. Depois rode de novo `20260716120000_init.sql`

### Quero voltar ao modo preview (sem login)
- Esvazie `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local` e reinicie o dev server

---

## O que o app faz sozinho depois que você configura

Quando alguém se cadastra, o Supabase:

1. Cria o usuário em **Auth**
2. Um *trigger* cria automaticamente:
   - linha em `profiles`
   - linha em `settings`
   - categorias padrão (Salário, Mercado, Moradia, etc.)

Você **não** precisa criar essas linhas na mão.

---

## Próximo passo depois deste guia

Com o banco e o login ok, seguimos para **Contas / Categorias / Transações** (dados reais no dashboard).
