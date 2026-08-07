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

## Documentação (Swagger)

- UI: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- OpenAPI JSON: [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json)

## Integração Typebot — contrato v1

`POST /api/v1/integrations/typebot/leads`

Captura versionada do lead enviado pelo Typebot. Exige o header `X-Integration-Key` com o valor de `TYPEBOT_WEBHOOK_SECRET` (ausência ou valor inválido → `401`). A chave nunca é ecoada em logs, payloads persistidos ou respostas. Propriedades sem espaço e sem acento. Campos futuros podem ser enviados, mas **não** são obrigatórios. Mudanças incompatíveis devem usar nova versão da rota (ex.: `/api/v2/...`).

### Campos

| Campo | Obrigatório | Observação |
| ----- | ----------- | ---------- |
| `submittedAt` | Sim | Formato livre do Typebot |
| `nome` | Sim | |
| `celular` | Sim | Normalização para dígitos em etapa posterior |
| `email` | Sim | Normalização para minúsculas em etapa posterior |
| `temVeiculo` | Sim | `Sim` ou `Não` |
| `tipoVeiculo` | Condicional | Obrigatório quando `temVeiculo = Sim` |
| `marcaModelo` | Condicional | Obrigatório quando `temVeiculo = Sim` |
| `anoVeiculo` | Condicional | Obrigatório quando `temVeiculo = Sim` |
| `estiloVeiculoDesejado` | Sim | |
| `valorVeiculoDesejado` | Sim | |
| `descricaoVeiculoDesejado` | Sim | |

### Exemplo

```bash
curl -X POST http://localhost:3000/api/v1/integrations/typebot/leads \
  -H "Content-Type: application/json" \
  -H "X-Integration-Key: $TYPEBOT_WEBHOOK_SECRET" \
  -d '{
    "submittedAt": "7 de ago., 10:23",
    "nome": "Bruno",
    "celular": "(11) 99999-9999",
    "email": "bruno@email.com",
    "temVeiculo": "Sim",
    "tipoVeiculo": "Carro",
    "marcaModelo": "Chevrolet Onix Plus",
    "anoVeiculo": "2022",
    "estiloVeiculoDesejado": "SUV",
    "valorVeiculoDesejado": "R$ 80 a 120 mil",
    "descricaoVeiculoDesejado": "Quero um carro econômico e confortável para viajar."
  }'
```

Sucesso (`HTTP 202`):

```json
{
  "data": {
    "accepted": true,
    "message": "Payload do Typebot validado com sucesso"
  },
  "correlationId": "..."
}
```

Erro de validação (`HTTP 400`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": {},
    "correlationId": "..."
  }
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
| `TYPEBOT_WEBHOOK_SECRET` | **Sim**                          | Valor esperado no header `X-Integration-Key`   |
| `CRM_API_URL`            | **Sim**                          | URL da API do CRM                              |
| `CRM_API_KEY`            | **Sim**                          | Chave da API do CRM                            |
| `OPENAI_API_KEY`         | **Sim**                          | Chave da API OpenAI                            |

## Logs (Pino)

- Cada requisição gera log de **entrada** e **conclusão** com método, rota, status, duração (`durationMs`) e Correlation ID (`x-correlation-id`).
- Telefone e e-mail são mascarados nos logs (ex.: `***1234`, `j***@dominio.com`).
- Segredos (`TYPEBOT_WEBHOOK_SECRET`, `CRM_API_KEY`, `OPENAI_API_KEY`, `authorization`, `apiKey`, `x-integration-key`) são substituídos por `[REDACTED]`.

## Estrutura

```
src/
├── app.ts              # App Express e rotas base
├── server.ts           # Bootstrap do servidor
├── config/             # Env (Zod) e logger (Pino)
├── database/           # DataSource, migrations e seeds
├── docs/               # OpenAPI + Swagger UI
├── modules/            # Domínios da aplicação (incl. integrations/typebot)
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
- **Swagger UI** — documentação OpenAPI em `/api/docs`
- **Pino** — logs
- **Axios** — clientes HTTP
- **dotenv** — variáveis de ambiente
- **ESLint** + **Prettier** — lint e formatação
- **Vitest** — testes e cobertura
