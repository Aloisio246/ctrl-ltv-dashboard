# Ctrl LTV

Central premium de operação **da captação ao LTV**: captação → prospecção → negociação → cliente → receita → retenção → LTV, em uma única interface.

## Fase atual — Fase 0 (Frontend Only)

Esta entrega contém **apenas o frontend** da plataforma. Nada de backend real está habilitado nesta fase:

- **Sem Supabase, sem Lovable Cloud Database, sem autenticação, sem Edge Functions.**
- Dados exibidos são simulados e ficam centralizados em `src/lib/mock/`.
- O cliente HTTP (`src/lib/api-client.ts`) está preparado para consumir uma API externa via `VITE_API_URL`, mas não faz chamadas reais agora.

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
| `/capture`      | placeholder — planejado                    |
| `/prospects`    | placeholder — planejado                    |
| `/pipeline`     | placeholder — planejado                    |
| `/inbox`        | placeholder — planejado                    |
| `/approvals`    | placeholder — planejado                    |
| `/activities`   | placeholder — planejado                    |
| `/clients`      | placeholder — planejado                    |
| `/finance`      | placeholder — planejado                    |
| `/retention`    | placeholder — planejado                    |
| `/reports`      | placeholder — planejado                    |
| `/settings`     | placeholder — planejado                    |

## GitHub

Este projeto foi construído para viver também fora do Lovable. Após conectar ao GitHub:

1. Conecte via **GitHub → Connect** no editor do Lovable.
2. Toda alteração feita no Lovable é comitada automaticamente na branch principal do repositório.
3. Trabalhando localmente, mantenha `main` sincronizado (`git pull` antes de novos commits, `git push` depois) para evitar divergência com o editor.
4. Backend, PostgreSQL, Redis, filas, workers e integrações reais rodarão em Docker/VM em fases posteriores — este repositório permanece dedicado ao frontend.

## Aviso

Nenhum banco de dados ou serviço backend está habilitado nesta fase. Não habilite Supabase / Lovable Cloud nesta etapa: o backend será conectado por API externa em uma fase posterior.
