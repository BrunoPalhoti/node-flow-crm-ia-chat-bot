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
  WEBHOOK_EVENT_TYPEBOT_LEAD_VALIDATION_FAILED,
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

  it("rejeita campo obrigatório só com espaços", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      nome: "   ",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fieldErrors).toEqual(
      expect.objectContaining({
        nome: expect.arrayContaining(["Campo obrigatório"]),
      }),
    );
  });

  it("aceita campos no limite máximo", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      nome: "A".repeat(120),
      submittedAt: "s".repeat(80),
      estiloVeiculoDesejado: "E".repeat(120),
      valorVeiculoDesejado: "V".repeat(120),
      descricaoVeiculoDesejado: "D".repeat(1000),
    });

    expect(response.status).toBe(202);
  });

  it("rejeita campos acima do tamanho máximo sem truncar", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      nome: "A".repeat(121),
      submittedAt: "s".repeat(81),
      estiloVeiculoDesejado: "E".repeat(121),
      valorVeiculoDesejado: "V".repeat(121),
      descricaoVeiculoDesejado: "D".repeat(1001),
      tipoVeiculo: "T".repeat(81),
      marcaModelo: "M".repeat(81),
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.fieldErrors).toEqual(
      expect.objectContaining({
        nome: expect.arrayContaining(["Campo excede o tamanho máximo"]),
        submittedAt: expect.arrayContaining(["Campo excede o tamanho máximo"]),
        estiloVeiculoDesejado: expect.arrayContaining([
          "Campo excede o tamanho máximo",
        ]),
        valorVeiculoDesejado: expect.arrayContaining([
          "Campo excede o tamanho máximo",
        ]),
        descricaoVeiculoDesejado: expect.arrayContaining([
          "Campo excede o tamanho máximo",
        ]),
        tipoVeiculo: expect.arrayContaining(["Campo excede o tamanho máximo"]),
        marcaModelo: expect.arrayContaining(["Campo excede o tamanho máximo"]),
      }),
    );
  });

  it.each(["sim", "SIM", "Sim"])(
    "aceita temVeiculo=%s como Sim",
    async (temVeiculo) => {
      const app = createApp();

      const response = await withIntegrationKey(
        request(app).post("/api/v1/integrations/typebot/leads"),
      ).send({
        ...validPayloadWithVehicle,
        temVeiculo,
      });

      expect(response.status).toBe(202);
      expect(response.body.data.accepted).toBe(true);
    },
  );

  it.each(["nao", "NAO", "não", "NÃO", "Não"])(
    "aceita temVeiculo=%s como Não",
    async (temVeiculo) => {
      const app = createApp();

      const response = await withIntegrationKey(
        request(app).post("/api/v1/integrations/typebot/leads"),
      ).send({
        ...validPayloadWithoutVehicle,
        temVeiculo,
      });

      expect(response.status).toBe(202);
      expect(response.body.data.accepted).toBe(true);
    },
  );

  it("rejeita temVeiculo inválido no próprio campo", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      temVeiculo: "talvez",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.fieldErrors).toEqual(
      expect.objectContaining({
        temVeiculo: expect.arrayContaining([
          'temVeiculo deve ser "Sim" ou "Não"',
        ]),
      }),
    );
  });

  it("usa o valor canônico Sim no superRefine (sim sem detalhes do veículo)", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      temVeiculo: "sim",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fieldErrors).toEqual(
      expect.objectContaining({
        tipoVeiculo: expect.any(Array),
        marcaModelo: expect.any(Array),
        anoVeiculo: expect.any(Array),
      }),
    );
  });

  it("rejeita e-mail em formato inválido no campo email", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      email: "nao-e-um-email",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fieldErrors).toEqual(
      expect.objectContaining({
        email: expect.arrayContaining(["E-mail em formato inválido"]),
      }),
    );
  });

  it("aceita e-mail com letras maiúsculas sem converter", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      email: "Ana.Silva@Email.COM",
    });

    expect(response.status).toBe(202);
  });

  it("rejeita celular com poucos dígitos sem alterar o valor", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      celular: "(11) 123",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fieldErrors).toEqual(
      expect.objectContaining({
        celular: expect.arrayContaining(["Celular em formato inválido"]),
      }),
    );
  });

  it("aceita celular com máscara e 11 dígitos", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      celular: "(11) 99999-9999",
    });

    expect(response.status).toBe(202);
  });

  it("aceita temVeiculo = Não com detalhes do veículo vazios", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      tipoVeiculo: "",
      marcaModelo: "   ",
      anoVeiculo: "",
    });

    expect(response.status).toBe(202);
    expect(response.body.data.accepted).toBe(true);
  });

  it("aceita temVeiculo = Não com detalhes do veículo preenchidos", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithoutVehicle,
      tipoVeiculo: "Carro",
      marcaModelo: "Fiat Uno",
      anoVeiculo: "2010",
    });

    expect(response.status).toBe(202);
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

  it.each(["22", "2022.0", "2022a", "1899"])(
    "rejeita anoVeiculo=%s sem corrigir o valor",
    async (anoVeiculo) => {
      const app = createApp();

      const response = await withIntegrationKey(
        request(app).post("/api/v1/integrations/typebot/leads"),
      ).send({
        ...validPayloadWithVehicle,
        anoVeiculo,
      });

      expect(response.status).toBe(400);
      expect(response.body.error.details.fieldErrors).toEqual(
        expect.objectContaining({
          anoVeiculo: expect.arrayContaining(["Ano do veículo inválido"]),
        }),
      );
    },
  );

  it("aceita anoVeiculo inteiro plausível", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithVehicle,
      anoVeiculo: "2022",
    });

    expect(response.status).toBe(202);
  });

  it("rejeita anoVeiculo acima do teto UTC+1", async () => {
    const app = createApp();
    const tooFar = String(new Date().getUTCFullYear() + 2);

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithVehicle,
      anoVeiculo: tooFar,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fieldErrors.anoVeiculo).toEqual(
      expect.arrayContaining(["Ano do veículo inválido"]),
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

describe("chatbot_webhook_logs em rejeição", () => {
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

  it("persiste log de validação com session_id nulo e status 400", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send({
      ...validPayloadWithVehicle,
      email: "invalido",
    });

    expect(response.status).toBe(400);

    const repo = AppDataSource.getRepository(ChatbotWebhookLog);
    const entry = await repo.findOne({
      where: { correlationId: response.body.error.correlationId },
    });

    expect(entry).not.toBeNull();
    expect(entry?.sessionId).toBeNull();
    expect(entry?.eventType).toBe(
      WEBHOOK_EVENT_TYPEBOT_LEAD_VALIDATION_FAILED,
    );
    expect(entry?.processingStatus).toBe(WEBHOOK_PROCESSING_REJECTED);
    expect(entry?.statusCode).toBe(400);
    expect(entry?.errorMessage).toBe("Dados inválidos");
  });

  it("não grava chatbot_webhook_logs em payload válido (202)", async () => {
    const app = createApp();

    const response = await withIntegrationKey(
      request(app).post("/api/v1/integrations/typebot/leads"),
    ).send(validPayloadWithoutVehicle);

    expect(response.status).toBe(202);

    const repo = AppDataSource.getRepository(ChatbotWebhookLog);
    const entries = await repo.find({
      where: { correlationId: response.body.correlationId },
    });

    expect(entries).toHaveLength(0);
  });
});
