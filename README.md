# Flow CRM IA Chat Bot

API em Node.js + TypeScript para CRM automotivo: recebe dados do Typebot, cadastra e enriquece leads, consulta estoque, recomenda veículos com IA/RAG e registra o resultado no CRM.

## Requisitos

- Node.js 20+
- npm 10+

## Começando

```bash
npm install
cp .env.example .env
npm run dev
```

A API sobe em `http://localhost:3000` (porta configurável via `PORT`).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento com hot reload (`tsx watch`) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa a build de produção |
| `npm run typecheck` | Verifica tipos sem emitir arquivos |

## Health check

```bash
curl http://localhost:3000/health
```

Resposta esperada (`HTTP 200`):

```json
{
  "status": "ok",
  "service": "flow-crm-ia-chat-bot",
  "timestamp": "2026-08-06T16:48:02.224Z"
}
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores locais. O arquivo `.env` **não** deve ser versionado.

| Variável | Descrição |
|----------|-----------|
| `NODE_ENV` | Ambiente (`development`, `test`, `production`) |
| `PORT` | Porta HTTP (padrão: `3000`) |
| `LOG_LEVEL` | Nível do Pino (`info`, `debug`, etc.) |
| `DATABASE_PATH` | Caminho do SQLite |
| `TYPEBOT_WEBHOOK_SECRET` | Segredo do webhook Typebot |
| `CRM_API_URL` | URL da API do CRM |
| `CRM_API_KEY` | Chave da API do CRM |
| `OPENAI_API_KEY` | Chave da API OpenAI |

## Estrutura

```
src/
├── app.ts              # App Express e rotas base
├── server.ts           # Bootstrap do servidor
├── config/             # Env (Zod) e logger (Pino)
├── database/           # TypeORM / SQLite
├── modules/            # Domínios da aplicação
├── providers/          # Integrações externas
└── shared/             # Utilitários compartilhados
```

## Stack

- **Express** — HTTP
- **TypeORM** + **SQLite** — persistência
- **Zod** — validação de env e payloads
- **Pino** — logs
- **Axios** — clientes HTTP
- **dotenv** — variáveis de ambiente
