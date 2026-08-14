import { z } from "zod";

const nonEmptyString = z.string().trim().min(1, "Campo obrigatório");

const TEM_VEICULO_ERROR = 'temVeiculo deve ser "Sim" ou "Não"';

function canonicalizeTemVeiculo(value: string): "Sim" | "Não" | string {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

  if (normalized === "sim") {
    return "Sim";
  }

  if (normalized === "nao") {
    return "Não";
  }

  return value;
}

const temVeiculoSchema = z.preprocess(
  (value) =>
    typeof value === "string" ? canonicalizeTemVeiculo(value) : value,
  z.enum(["Sim", "Não"], {
    error: TEM_VEICULO_ERROR,
  }),
);

export const typebotLeadRequestSchema = z
  .object({
    submittedAt: nonEmptyString,
    nome: nonEmptyString,
    celular: nonEmptyString,
    email: nonEmptyString,
    temVeiculo: temVeiculoSchema,
    tipoVeiculo: z.string().trim().optional(),
    marcaModelo: z.string().trim().optional(),
    anoVeiculo: z.string().trim().optional(),
    estiloVeiculoDesejado: nonEmptyString,
    valorVeiculoDesejado: nonEmptyString,
    descricaoVeiculoDesejado: nonEmptyString,
  })
  .passthrough()
  .superRefine((data, ctx) => {
    if (data.temVeiculo !== "Sim") {
      return;
    }

    const conditionalFields = [
      "tipoVeiculo",
      "marcaModelo",
      "anoVeiculo",
    ] as const;

    for (const field of conditionalFields) {
      const value = data[field];
      if (typeof value !== "string" || value.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${field} é obrigatório quando temVeiculo = Sim`,
        });
      }
    }
  });

export type TypebotLeadRequest = z.infer<typeof typebotLeadRequestSchema>;

export type TypebotLeadAcceptedResponse = {
  accepted: true;
  message: string;
};
