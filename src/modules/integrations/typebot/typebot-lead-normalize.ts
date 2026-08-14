import {
  normalizeEmail,
  normalizePhoneDigits,
  parseSimNaoToBoolean,
  parseVehicleYear,
} from "../../../shared/normalize";
import type { TypebotLeadRequest } from "./typebot-lead.schema";

export type CollectedAnswerNormalized = {
  fieldName: string;
  answerValue: string;
  normalizedValue: string | null;
};

export type TypebotLeadNormalizedFields = {
  collectedAnswers: CollectedAnswerNormalized[];
  lead: {
    phone: string;
    email: string;
  };
  tradeVehicle: {
    hasVehicle: boolean;
    year?: number;
  };
};

function rawString(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function collectedAnswer(
  fieldName: string,
  answerValue: string,
  normalizedValue: string | null,
): CollectedAnswerNormalized {
  return { fieldName, answerValue, normalizedValue };
}

export function mapTypebotLeadNormalizedFields(
  rawBody: unknown,
  parsed: TypebotLeadRequest,
): TypebotLeadNormalizedFields {
  const originalCelular = rawString(rawBody, "celular") ?? parsed.celular;
  const originalEmail = rawString(rawBody, "email") ?? parsed.email;
  const originalTemVeiculo =
    rawString(rawBody, "temVeiculo") ?? parsed.temVeiculo;
  const originalAnoVeiculo = rawString(rawBody, "anoVeiculo");

  const phone = normalizePhoneDigits(originalCelular);
  const email = normalizeEmail(originalEmail);
  const hasVehicle = parseSimNaoToBoolean(originalTemVeiculo);

  const yearSource = originalAnoVeiculo ?? parsed.anoVeiculo;
  const yearTrimmed = yearSource?.trim() ?? "";
  const year =
    yearTrimmed.length > 0 ? parseVehicleYear(yearTrimmed) : undefined;

  const collectedAnswers: CollectedAnswerNormalized[] = [
    collectedAnswer("celular", originalCelular, phone),
    collectedAnswer("email", originalEmail, email),
    collectedAnswer(
      "temVeiculo",
      originalTemVeiculo,
      hasVehicle ? "true" : "false",
    ),
  ];

  if (yearTrimmed.length > 0 && year !== undefined) {
    collectedAnswers.push(
      collectedAnswer(
        "anoVeiculo",
        originalAnoVeiculo ?? yearTrimmed,
        String(year),
      ),
    );
  } else if (originalAnoVeiculo !== undefined) {
    collectedAnswers.push(
      collectedAnswer("anoVeiculo", originalAnoVeiculo, null),
    );
  }

  return {
    collectedAnswers,
    lead: { phone, email },
    tradeVehicle: {
      hasVehicle,
      ...(year !== undefined ? { year } : {}),
    },
  };
}
