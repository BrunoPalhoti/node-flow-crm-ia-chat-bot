import { z } from "zod";

const nonEmptyString = z.string().trim().min(1, "Campo obrigatório");

export const typebotLeadRequestSchema = z
  .object({
    submittedAt: nonEmptyString,
    nome: nonEmptyString,
    celular: nonEmptyString,
    email: nonEmptyString,
    temVeiculo: z.enum(["Sim", "Não"], {
      error: 'temVeiculo deve ser "Sim" ou "Não"',
    }),
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
