# Ctrl LTV

Central premium de operação **da captação ao LTV**: captação → prospecção → negociação → cliente → receita → retenção → LTV, em uma única interface.

## Fase atual — Beta local

O frontend beta roda localmente conectado à API própria em Docker. O projeto continua sem Supabase e sem Lovable Cloud:

- **Sem Supabase, sem Lovable Cloud Database e sem Edge Functions.**
- A autenticação e os dados operacionais são fornecidos pelo backend local em `backend-foundation`.
- O cliente HTTP (`src/lib/api-client.ts`) usa `VITE_API_URL` para acessar a API local ou uma API externa.

## Stack

- TanStack Start + TanStack Router (roteamento por arquivos em `src/routes/`)
- React 19 + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Framer Motion para transições com propósito
- Recharts para o gráfico executivo
- Vite 8 como bundler

## Comandos

```sh
# instalar dependências
bun install    # ou: npm install

# desenvolvimento
bun run dev    # http://localhost:8080

# checagem de tipos
bunx tsgo --noEmit

# build de produção
bun run build

# build em modo development (prerender rápido)
bun run build:dev
```

## Rodar no Docker Desktop

Com a API local ativa na porta 4000:

```sh
copy .env.docker.example .env
docker compose up -d --build
```

Depois acesse [http://localhost:8081](http://localhost:8081). Como as chamadas são feitas pelo navegador, o frontend usa `http://localhost:4000` para alcançar a API publicada pelo Docker Desktop. Em uma VM ou ambiente remoto, substitua `VITE_API_URL` pela URL pública da API. Para não deixar credenciais no arquivo de configuração, remova `VITE_API_EMAIL` e `VITE_API_PASSWORD` do `.env` e use a tela de login.

Para acompanhar ou parar o frontend:

```sh
docker compose logs -f frontend
docker compose down
```

## Variáveis de ambiente

| Variável        | Uso                                                                 |
| --------------- | ------------------------------------------------------------------- |
| `VITE_API_URL`  | Base da API externa que será consumida em fases futuras. Opcional agora — sem ela, o cliente HTTP permanece inativo. |

Crie um arquivo `.env` na raiz quando for necessário:

```
VITE_API_URL=https://api.exemplo.com
```

## Rotas canônicas

| Rota            | Status                                     |
| --------------- | ------------------------------------------ |
| `/`             | redireciona para `/dashboard`              |
| `/dashboard`    | **implementado** — visão executiva completa |
| `/capture`      | integrado à API local                      |
| `/prospects`    | integrado à API local                      |
| `/pipeline`     | integrado à API local                      |
| `/inbox`        | integrado à API local                      |
| `/approvals`    | integrado à API local                      |
| `/activities`   | integrado à API local                      |
| `/clients`      | integrado à API local                      |
| `/finance`      | integrado à API local                      |
| `/retention`    | integrado à API local                      |
| `/reports`      | integrado à API local                      |
| `/settings`     | integrado à API local                      |

## GitHub

Este projeto foi construído para viver também fora do Lovable. Após conectar ao GitHub:

1. Conecte via **GitHub → Connect** no editor do Lovable.
2. Toda alteração feita no Lovable é comitada automaticamente na branch principal do repositório.
3. Trabalhando localmente, mantenha `main` sincronizado (`git pull` antes de novos commits, `git push` depois) para evitar divergência com o editor.
4. Backend, PostgreSQL, Redis, filas, workers e integrações reais rodam no stack Docker/VM separado; este repositório permanece dedicado ao frontend.

## Aviso

Não habilite Supabase / Lovable Cloud. O backend é próprio e acessado pelo frontend através de `VITE_API_URL`.
