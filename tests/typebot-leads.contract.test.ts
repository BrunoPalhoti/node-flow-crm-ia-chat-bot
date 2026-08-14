import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { env } from "../src/config/env";
import {
  AppDataSource,
  destroyDatabase,
  initializeDatabase,
} from "../src/database";
import {
  WEBHOOK_EVENT_TYPEBOT_LEAD_UNAUTHORIZED,
  WEBHOOK_PROCESSING_REJECTED,
} from "../src/modules/chatbot/chatbot-webhook-log.service";
import { ChatbotWebhookLog } from "../src/modules/chatbot/entities/chatbot-webhook-log.entity";
import { INTEGRATION_KEY_HEADER } from "../src/middlewares/integration-key.middleware";

const INTEGRATION_KEY = env.TYPEBOT_WEBHOOK_SECRET;

const validPayloadWithVehicle = {
  submittedAt: "7 de ago., 10:23",
  nome: "Bruno",
  celular: "(11) 99999-9999",
  email: "bruno@email.com",
  temVeiculo: "Sim",
  tipoVeiculo: "Carro",
  marcaModelo: "Chevrolet Onix Plus",
  anoVeiculo: "2022",
  estiloVeiculoDesejado: "SUV",
  valorVeiculoDesejado: "R$ 80 a 120 mil",
  descricaoVeiculoDesejado:
    "Quero um carro econômico e confortável para viajar.",
};

const validPayloadWithoutVehicle = {
  submittedAt: "7 de ago., 10:23",
  nome: "Ana",
  celular: "(21) 98888-7777",
  email: "ana@email.com",
  temVeiculo: "Não",
  estiloVeiculoDesejado: "Hatch",
  valorVeiculoDesejado: "Até R$ 60 mil",
  descricaoVeiculoDesejado: "Preciso de um carro compacto para o dia a dia.",
};

function withIntegrationKey(
  req: request.Test,
  key: string = INTEGRATION_KEY,
): request.Test {
  return req.set(INTEGRATION_KEY_HEADER, key);
}

describe("POST /api/v1/integrations/typebot/leads", () => {
  it("aceita payload completo com veículo", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send(validPayloadWithVehicle);

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      data: {
        accepted: true,
        message: "Payload do Typebot validado com sucesso",
      },
      correlationId: expect.any(String),
    });
  });

  it("aceita payload sem veículo (campos condicionais omitidos)", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send(validPayloadWithoutVehicle);

    expect(response.status).toBe(202);
    expect(response.body.data.accepted).toBe(true);
  });

  it("aceita campos futuros extras sem torná-los obrigatórios", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      campoFuturo: "valor-opcional",
    });

    expect(response.status).toBe(202);
  });

  it("rejeita payload sem campos obrigatórios", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      submittedAt: "7 de ago., 10:23",
      temVeiculo: "Não",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.correlationId).toEqual(expect.any(String));
    expect(response.body.error.details.fieldErrors).toEqual(
      expect.objectContaining({
        nome: expect.any(Array),
        celular: expect.any(Array),
        email: expect.any(Array),
        estiloVeiculoDesejado: expect.any(Array),
        valorVeiculoDesejado: expect.any(Array),
        descricaoVeiculoDesejado: expect.any(Array),
      }),
    );
  });

  it("exige tipo/marcaModelo/ano quando temVeiculo = Sim", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithVehicle,
      tipoVeiculo: "",
      marcaModelo: undefined,
      anoVeiculo: "   ",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.fieldErrors).toEqual(
      expect.objectContaining({
        tipoVeiculo: expect.any(Array),
        marcaModelo: expect.any(Array),
        anoVeiculo: expect.any(Array),
      }),
    );
  });

  it("retorna 401 sem X-Integration-Key", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/integrations/typebot/leads")
      .send(validPayloadWithoutVehicle);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Credencial ausente ou inválida",
        correlationId: expect.any(String),
      },
    });
    expect(JSON.stringify(response.body)).not.toContain(INTEGRATION_KEY);
  });

  it("retorna 401 com X-Integration-Key inválida", async () => {
    const app = createApp();
    const invalidKey = "chave-invalida-nao-usar";

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
      invalidKey,
    ).send(validPayloadWithoutVehicle);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(JSON.stringify(response.body)).not.toContain(invalidKey);
    expect(JSON.stringify(response.body)).not.toContain(INTEGRATION_KEY);
  });
});

describe("Swagger", () => {
  it("expõe o documento OpenAPI em /api/docs.json", async () => {
    const app = createApp();

    const response = await request(app).get("/api/docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.3");
    expect(
      response.body.paths["/api/v1/integrations/typebot/leads"].post,
    ).toBeDefined();
    expect(
      response.body.components.securitySchemes.IntegrationKey,
    ).toBeDefined();
  });
});

describe("chatbot_webhook_logs em rejeição de auth", () => {
  beforeAll(async () => {
    await initializeDatabase();
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "chatbot_webhook_logs" (
        "id" varchar NOT NULL,
        "session_id" varchar,
        "event_type" varchar(50) NOT NULL,
        "correlation_id" varchar(100) NOT NULL,
        "request_payload" text NOT NULL,
        "response_payload" text,
        "status_code" integer,
        "processing_status" varchar(30) NOT NULL,
        "error_message" text,
        "received_at" datetime NOT NULL,
        CONSTRAINT "PK_chatbot_webhook_logs" PRIMARY KEY ("id")
      )
    `);
  });

  afterAll(async () => {
    await destroyDatabase();
  });

  it("persiste log sem a chave e com session_id nulo", async () => {
    const app = createApp();
    const invalidKey = "segredo-que-nao-deve-persistir";

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
      invalidKey,
    ).send(validPayloadWithoutVehicle);

    expect(response.status).toBe(401);

    const repo = AppDataSource.getRepository(ChatbotWebhookLog);
    const entry = await repo.findOne({
      where: { correlationId: response.body.error.correlationId },
    });

    expect(entry).not.toBeNull();
    expect(entry?.sessionId).toBeNull();
    expect(entry?.eventType).toBe(WEBHOOK_EVENT_TYPEBOT_LEAD_UNAUTHORIZED);
    expect(entry?.processingStatus).toBe(WEBHOOK_PROCESSING_REJECTED);
    expect(entry?.statusCode).toBe(401);
    expect(entry?.requestPayload).not.toContain(invalidKey);
    expect(entry?.requestPayload).not.toContain(INTEGRATION_KEY);
    expect(entry?.errorMessage).not.toContain(invalidKey);
  });
});
