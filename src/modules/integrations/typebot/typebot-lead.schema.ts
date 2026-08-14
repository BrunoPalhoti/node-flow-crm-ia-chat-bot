import { z } from "zod";
import { utcCalendarYear } from "../../../shared/date/utc";
import { foldSimNaoKey } from "../../../shared/normalize";

const FIELD_TOO_LONG = "Campo excede o tamanho máximo";
const EMAIL_INVALID = "E-mail em formato inválido";
const CELULAR_INVALID = "Celular em formato inválido";
const TEM_VEICULO_ERROR = 'temVeiculo deve ser "Sim" ou "Não"';
const ANO_VEICULO_INVALID = "Ano do veículo inválido";
const MIN_VEHICLE_YEAR = 1900;

const FIELD_MAX = {
  submittedAt: 80,
  nome: 120,
  celular: 32,
  email: 254,
  tipoVeiculo: 80,
  marcaModelo: 80,
  estiloVeiculoDesejado: 120,
  valorVeiculoDesejado: 120,
  descricaoVeiculoDesejado: 1000,
} as const;

function requiredString(max: number) {
  return z.string().trim().min(1, "Campo obrigatório").max(max, FIELD_TOO_LONG);
}

function optionalTrimmedString(max: number) {
  return z.string().trim().max(max, FIELD_TOO_LONG).optional();
}

function canonicalizeTemVeiculo(value: string): "Sim" | "Não" | string {
  const key = foldSimNaoKey(value);

  if (key === "sim") {
    return "Sim";
  }

  if (key === "nao") {
    return "Não";
  }

  return value;
}

function hasBasicPhoneDigitCount(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

function isPlausibleVehicleYear(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  const year = Number(value);

  if (!Number.isInteger(year)) {
    return false;
  }

  const maxYear = utcCalendarYear() + 1;
  return year >= MIN_VEHICLE_YEAR && year <= maxYear;
}

const submittedAtSchema = requiredString(FIELD_MAX.submittedAt);
const nomeSchema = requiredString(FIELD_MAX.nome);
const celularSchema = requiredString(FIELD_MAX.celular).refine(
  hasBasicPhoneDigitCount,
  { message: CELULAR_INVALID },
);
const emailSchema = requiredString(FIELD_MAX.email).check(
  z.email({ error: EMAIL_INVALID }),
);
const temVeiculoSchema = z.preprocess(
  (value) =>
    typeof value === "string" ? canonicalizeTemVeiculo(value) : value,
  z.enum(["Sim", "Não"], {
    error: TEM_VEICULO_ERROR,
  }),
);
const tipoVeiculoSchema = optionalTrimmedString(FIELD_MAX.tipoVeiculo);
const marcaModeloSchema = optionalTrimmedString(FIELD_MAX.marcaModelo);
const anoVeiculoSchema = z.string().trim().optional();
const estiloVeiculoDesejadoSchema = requiredString(
  FIELD_MAX.estiloVeiculoDesejado,
);
const valorVeiculoDesejadoSchema = requiredString(
  FIELD_MAX.valorVeiculoDesejado,
);
const descricaoVeiculoDesejadoSchema = requiredString(
  FIELD_MAX.descricaoVeiculoDesejado,
);

const VEHICLE_DETAIL_FIELDS = [
  "tipoVeiculo",
  "marcaModelo",
  "anoVeiculo",
] as const;

function refineVehicleDetailsWhenOwned(
  data: {
    temVeiculo: "Sim" | "Não";
    tipoVeiculo?: string;
    marcaModelo?: string;
    anoVeiculo?: string;
  },
  ctx: z.RefinementCtx,
) {
  if (data.temVeiculo !== "Sim") {
    return;
  }

  for (const field of VEHICLE_DETAIL_FIELDS) {
    const value = data[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: `${field} é obrigatório quando temVeiculo = Sim`,
      });
    }
  }

  const year = data.anoVeiculo?.trim();
  if (year && !isPlausibleVehicleYear(year)) {
    ctx.addIssue({
      code: "custom",
      path: ["anoVeiculo"],
      message: ANO_VEICULO_INVALID,
    });
  }
}

export const typebotLeadRequestSchema = z
  .object({
    submittedAt: submittedAtSchema,
    nome: nomeSchema,
    celular: celularSchema,
    email: emailSchema,
    temVeiculo: temVeiculoSchema,
    tipoVeiculo: tipoVeiculoSchema,
    marcaModelo: marcaModeloSchema,
    anoVeiculo: anoVeiculoSchema,
    estiloVeiculoDesejado: estiloVeiculoDesejadoSchema,
    valorVeiculoDesejado: valorVeiculoDesejadoSchema,
    descricaoVeiculoDesejado: descricaoVeiculoDesejadoSchema,
  })
  .passthrough()
  .superRefine(refineVehicleDetailsWhenOwned);

export type TypebotLeadRequest = z.infer<typeof typebotLeadRequestSchema>;

export type TypebotLeadAcceptedResponse = {
  accepted: true;
  message: string;
};
