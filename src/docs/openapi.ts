const typebotLeadRequestExample = {
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

const typebotLeadRequestWithoutVehicleExample = {
  submittedAt: "7 de ago., 10:23",
  nome: "Ana",
  celular: "(21) 98888-7777",
  email: "ana@email.com",
  temVeiculo: "Não",
  estiloVeiculoDesejado: "Hatch",
  valorVeiculoDesejado: "Até R$ 60 mil",
  descricaoVeiculoDesejado: "Preciso de um carro compacto para o dia a dia.",
};

const successExample = {
  data: {
    accepted: true,
    message: "Payload do Typebot validado com sucesso",
  },
  correlationId: "550e8400-e29b-41d4-a716-446655440000",
};

const validationErrorExample = {
  error: {
    code: "VALIDATION_ERROR",
    message: "Dados inválidos",
    details: {
      formErrors: [],
      fieldErrors: {
        nome: ["Campo obrigatório"],
        tipoVeiculo: ["tipoVeiculo é obrigatório quando temVeiculo = Sim"],
      },
    },
    correlationId: "550e8400-e29b-41d4-a716-446655440000",
  },
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Flow CRM IA Chat Bot API",
    version: "1.0.0",
    description:
      "API para CRM automotivo com integração Typebot. Mudanças incompatíveis de contrato devem usar nova versão da rota (ex.: /api/v2).",
  },
  servers: [{ url: "/", description: "Servidor atual" }],
  tags: [
    {
      name: "Health",
      description: "Disponibilidade do serviço",
    },
    {
      name: "Integrations / Typebot",
      description: "Contrato versionado de captura de leads do Typebot",
    },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Serviço saudável",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status", "service", "timestamp"],
                  properties: {
                    status: { type: "string", example: "ok" },
                    service: {
                      type: "string",
                      example: "flow-crm-ia-chat-bot",
                    },
                    timestamp: {
                      type: "string",
                      format: "date-time",
                      example: "2026-08-07T13:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/integrations/typebot/leads": {
      post: {
        tags: ["Integrations / Typebot"],
        summary: "Capturar lead do Typebot",
        description:
          "Recebe a submissão do Typebot, valida o contrato v1 e aceita o payload. " +
          "Campos obrigatórios: submittedAt, nome, celular, email, temVeiculo, " +
          "estiloVeiculoDesejado, valorVeiculoDesejado, descricaoVeiculoDesejado. " +
          "Quando temVeiculo = Sim, também são obrigatórios: tipoVeiculo, marcaModelo e anoVeiculo. " +
          "Campos futuros podem ser enviados, mas não são obrigatórios. " +
          "Mudanças incompatíveis devem usar uma nova versão da rota.",
        operationId: "createTypebotLeadV1",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TypebotLeadRequest",
              },
              examples: {
                comVeiculo: {
                  summary: "Cliente com veículo atual",
                  value: typebotLeadRequestExample,
                },
                semVeiculo: {
                  summary: "Cliente sem veículo atual",
                  value: typebotLeadRequestWithoutVehicleExample,
                },
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Payload válido e aceito",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TypebotLeadAcceptedResponse",
                },
                example: successExample,
              },
            },
          },
          "400": {
            description: "Erro de validação do contrato",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiErrorResponse",
                },
                example: validationErrorExample,
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TypebotLeadRequest: {
        type: "object",
        additionalProperties: true,
        required: [
          "submittedAt",
          "nome",
          "celular",
          "email",
          "temVeiculo",
          "estiloVeiculoDesejado",
          "valorVeiculoDesejado",
          "descricaoVeiculoDesejado",
        ],
        properties: {
          submittedAt: {
            type: "string",
            description: "Data/hora da submissão no formato livre do Typebot",
            example: "7 de ago., 10:23",
          },
          nome: {
            type: "string",
            description: "Nome do lead",
            example: "Bruno",
          },
          celular: {
            type: "string",
            description: "Telefone do lead (será normalizado para dígitos)",
            example: "(11) 99999-9999",
          },
          email: {
            type: "string",
            description: "E-mail do lead (será normalizado para minúsculas)",
            example: "bruno@email.com",
          },
          temVeiculo: {
            type: "string",
            enum: ["Sim", "Não"],
            description:
              "Indica se o cliente possui veículo. Quando Sim, tipoVeiculo, marcaModelo e anoVeiculo passam a ser obrigatórios.",
          },
          tipoVeiculo: {
            type: "string",
            description: "Obrigatório somente quando temVeiculo = Sim",
            example: "Carro",
          },
          marcaModelo: {
            type: "string",
            description:
              "Marca e modelo juntos. Não é separado automaticamente. Obrigatório somente quando temVeiculo = Sim",
            example: "Chevrolet Onix Plus",
          },
          anoVeiculo: {
            type: "string",
            description: "Obrigatório somente quando temVeiculo = Sim",
            example: "2022",
          },
          estiloVeiculoDesejado: {
            type: "string",
            example: "SUV",
          },
          valorVeiculoDesejado: {
            type: "string",
            example: "R$ 80 a 120 mil",
          },
          descricaoVeiculoDesejado: {
            type: "string",
            example: "Quero um carro econômico e confortável para viajar.",
          },
        },
      },
      TypebotLeadAcceptedResponse: {
        type: "object",
        required: ["data", "correlationId"],
        properties: {
          data: {
            type: "object",
            required: ["accepted", "message"],
            properties: {
              accepted: { type: "boolean", enum: [true] },
              message: { type: "string" },
            },
          },
          correlationId: {
            type: "string",
            format: "uuid",
          },
        },
      },
      ApiErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "correlationId"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Dados inválidos" },
              details: {
                type: "object",
                additionalProperties: true,
                description: "Detalhes do Zod (flattenError) quando aplicável",
              },
              correlationId: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
  },
};
