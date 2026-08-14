import { describe, expect, it } from "vitest";
import { mapTypebotLeadNormalizedFields } from "../src/modules/integrations/typebot/typebot-lead-normalize";
import { typebotLeadRequestSchema } from "../src/modules/integrations/typebot/typebot-lead.schema";
import {
  normalizeEmail,
  normalizePhoneDigits,
  parseSimNaoToBoolean,
  parseVehicleYear,
} from "../src/shared/normalize";

describe("normalizePhoneDigits", () => {
  it("remove caracteres não numéricos", () => {
    expect(normalizePhoneDigits("(11) 99999-9999")).toBe("11999999999");
  });
});

describe("normalizeEmail", () => {
  it("aplica trim e lowercase", () => {
    expect(normalizeEmail("Bruno@Email.COM")).toBe("bruno@email.com");
  });
});

describe("parseSimNaoToBoolean", () => {
  it.each(["Não", "nao", "NÃO"])("converte %s em false", (value) => {
    expect(parseSimNaoToBoolean(value)).toBe(false);
  });

  it.each(["Sim", "sim"])("converte %s em true", (value) => {
    expect(parseSimNaoToBoolean(value)).toBe(true);
  });
});

describe("parseVehicleYear", () => {
  it("converte string de dígitos em inteiro sem expandir", () => {
    expect(parseVehicleYear("2022")).toBe(2022);
    expect(parseVehicleYear("22")).toBe(22);
  });
});

describe("mapTypebotLeadNormalizedFields", () => {
  it("preserva o original e produz valores canônicos", () => {
    const rawBody = {
      submittedAt: "7 de ago., 10:23",
      nome: "Bruno",
      celular: "(11) 99999-9999",
      email: "Bruno@Email.COM",
      temVeiculo: "NÃO",
      estiloVeiculoDesejado: "SUV",
      valorVeiculoDesejado: "R$ 80 a 120 mil",
      descricaoVeiculoDesejado: "Quero um carro econômico.",
      anoVeiculo: "2022",
    };

    const parsed = typebotLeadRequestSchema.parse(rawBody);
    const mapped = mapTypebotLeadNormalizedFields(rawBody, parsed);

    expect(mapped.lead.phone).toBe("11999999999");
    expect(mapped.lead.email).toBe("bruno@email.com");
    expect(mapped.tradeVehicle.hasVehicle).toBe(false);
    expect(mapped.tradeVehicle.year).toBe(2022);

    expect(mapped.collectedAnswers).toEqual(
      expect.arrayContaining([
        {
          fieldName: "celular",
          answerValue: "(11) 99999-9999",
          normalizedValue: "11999999999",
        },
        {
          fieldName: "email",
          answerValue: "Bruno@Email.COM",
          normalizedValue: "bruno@email.com",
        },
        {
          fieldName: "temVeiculo",
          answerValue: "NÃO",
          normalizedValue: "false",
        },
        {
          fieldName: "anoVeiculo",
          answerValue: "2022",
          normalizedValue: "2022",
        },
      ]),
    );

    expect(parsed.email).toBe("Bruno@Email.COM");
    expect(parsed.celular).toBe("(11) 99999-9999");
  });
});
