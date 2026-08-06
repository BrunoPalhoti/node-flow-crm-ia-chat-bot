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

| Comando                      | Descrição                                     |
| ---------------------------- | --------------------------------------------- |
| `npm run dev`                | Desenvolvimento com hot reload (`tsx watch`)  |
| `npm run build`              | Compila TypeScript para `dist/`               |
| `npm start`                  | Executa a build de produção                   |
| `npm run typecheck`          | Verifica tipos sem emitir arquivos            |
| `npm run lint`               | Executa o ESLint                              |
| `npm run lint:fix`           | Corrige problemas de lint automaticamente     |
| `npm run format`             | Formata o código com Prettier                 |
| `npm run format:check`       | Verifica formatação sem alterar arquivos      |
| `npm run test`               | Executa a suíte de testes (Vitest)            |
| `npm run test:watch`         | Executa testes em modo watch                  |
| `npm run test:coverage`      | Executa testes com relatório de cobertura     |
| `npm run migration:run`      | Aplica migrations pendentes                   |
| `npm run migration:revert`   | Reverte a última migration                    |
| `npm run migration:show`     | Lista status das migrations                   |
| `npm run migration:create`   | Cria arquivo de migration vazio               |
| `npm run migration:generate` | Gera migration a partir do diff das entidades |
| `npm run seed`               | Executa seeds                                 |

## Persistência (TypeORM + SQLite)

- Caminho do banco: `DATABASE_PATH` (padrão `./data/crm.sqlite`)
- `synchronize` desabilitado — o schema só muda via migrations
- Datas da aplicação em **UTC** (`TZ=UTC` nos scripts e no bootstrap)
- Na inicialização, a API conecta ao SQLite antes de aceitar requisições

```bash
npm run migration:run
npm run migration:revert
npm run seed
```

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

A validação com Zod ocorre na carga do módulo `config/env`: se faltar variável obrigatória ou o valor for inválido, o processo encerra com código `1`.

| Variável                 | Obrigatória                      | Descrição                                      |
| ------------------------ | -------------------------------- | ---------------------------------------------- |
| `NODE_ENV`               | Não (padrão `development`)       | Ambiente (`development`, `test`, `production`) |
| `PORT`                   | Não (padrão `3000`)              | Porta HTTP                                     |
| `LOG_LEVEL`              | Não (padrão `info`)              | Nível do Pino                                  |
| `DATABASE_PATH`          | Não (padrão `./data/crm.sqlite`) | Caminho do SQLite                              |
| `TYPEBOT_WEBHOOK_SECRET` | **Sim**                          | Segredo do webhook Typebot                     |
| `CRM_API_URL`            | **Sim**                          | URL da API do CRM                              |
| `CRM_API_KEY`            | **Sim**                          | Chave da API do CRM                            |
| `OPENAI_API_KEY`         | **Sim**                          | Chave da API OpenAI                            |

## Logs (Pino)

- Cada requisição gera log de **entrada** e **conclusão** com método, rota, status, duração (`durationMs`) e Correlation ID (`x-correlation-id`).
- Telefone e e-mail são mascarados nos logs (ex.: `***1234`, `j***@dominio.com`).
- Segredos (`TYPEBOT_WEBHOOK_SECRET`, `CRM_API_KEY`, `OPENAI_API_KEY`, `authorization`, `apiKey`) são substituídos por `[REDACTED]`.

## Estrutura

```
src/
├── app.ts              # App Express e rotas base
├── server.ts           # Bootstrap do servidor
├── config/             # Env (Zod) e logger (Pino)
├── database/           # DataSource, migrations e seeds
├── modules/            # Domínios da aplicação
├── providers/          # Integrações externas
└── shared/             # Utilitários compartilhados
tests/                  # Testes automatizados (Vitest)
```

## Qualidade

```bash
npm run lint
npm run test
npm run test:coverage
npm run build
```

O health check possui teste automatizado em `tests/health.test.ts`.

## Stack

- **Express** — HTTP
- **TypeORM** + **better-sqlite3** — persistência
- **Zod** — validação de env e payloads
- **Pino** — logs
- **Axios** — clientes HTTP
- **dotenv** — variáveis de ambiente
- **ESLint** + **Prettier** — lint e formatação
- **Vitest** — testes e cobertura
