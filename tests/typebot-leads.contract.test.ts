import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

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

describe("POST /api/v1/integrations/typebot/leads", () => {
  it("aceita payload completo com veículo", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/integrations/typebot/leads")
      .send(validPayloadWithVehicle);

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

    const response = await request(app)
      .post("/api/v1/integrations/typebot/leads")
      .send(validPayloadWithoutVehicle);

    expect(response.status).toBe(202);
    expect(response.body.data.accepted).toBe(true);
  });

  it("aceita campos futuros extras sem torná-los obrigatórios", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/integrations/typebot/leads")
      .send({
        ...validPayloadWithoutVehicle,
        campoFuturo: "valor-opcional",
      });

    expect(response.status).toBe(202);
  });

  it("rejeita payload sem campos obrigatórios", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/integrations/typebot/leads")
      .send({
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

    const response = await request(app)
      .post("/api/v1/integrations/typebot/leads")
      .send({
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
  });
});
