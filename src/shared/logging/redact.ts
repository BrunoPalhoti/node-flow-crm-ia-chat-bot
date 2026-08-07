const EMAIL_KEYS = new Set([
  "email",
  "e-mail",
  "mail",
  "emailaddress",
  "email_address",
]);

const PHONE_KEYS = new Set([
  "phone",
  "telefone",
  "celular",
  "mobile",
  "whatsapp",
  "phonenumber",
  "phone_number",
]);

function normalizeKey(key: string | number): string {
  return String(key)
    .toLowerCase()
    .replace(/[-_\s]/g, "");
}

export function isEmailKey(key: string | number): boolean {
  return EMAIL_KEYS.has(normalizeKey(key));
}

export function isPhoneKey(key: string | number): boolean {
  return PHONE_KEYS.has(normalizeKey(key));
}

/**
 * Oculta e-mail completo: j***@dominio.com
 */
export function maskEmail(value: unknown): string {
  if (typeof value !== "string" || !value.includes("@")) {
    return "[REDACTED]";
  }

  const [local, domain] = value.split("@");
  if (!local || !domain) {
    return "[REDACTED]";
  }

  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}***@${domain}`;
}

/**
 * Oculta telefone completo: ***1234 (últimos 4 dígitos)
 */
export function maskPhone(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length < 4) {
    return "[REDACTED]";
  }

  return `***${digits.slice(-4)}`;
}

/**
 * Censor do Pino: PII parcialmente mascarado; segredos totalmente ocultos.
 */
export function redactCensor(value: unknown, path: string[]): string {
  const leaf = path[path.length - 1];

  if (leaf !== undefined && isEmailKey(leaf)) {
    return maskEmail(value);
  }

  if (leaf !== undefined && isPhoneKey(leaf)) {
    return maskPhone(value);
  }

  return "[REDACTED]";
}

/**
 * Paths redigidos em qualquer objeto logado pelo Pino.
 * Inclui PII (telefone/e-mail) e segredos de integração/LLM.
 */
export const REDACT_PATHS = [
  "email",
  "*.email",
  "*.*.email",
  "e-mail",
  "*.e-mail",
  "mail",
  "*.mail",
  "phone",
  "*.phone",
  "*.*.phone",
  "telefone",
  "*.telefone",
  "*.*.telefone",
  "celular",
  "*.celular",
  "mobile",
  "*.mobile",
  "whatsapp",
  "*.whatsapp",
  "TYPEBOT_WEBHOOK_SECRET",
  "*.TYPEBOT_WEBHOOK_SECRET",
  "CRM_API_KEY",
  "*.CRM_API_KEY",
  "OPENAI_API_KEY",
  "*.OPENAI_API_KEY",
  "apiKey",
  "*.apiKey",
  "api_key",
  "*.api_key",
  "authorization",
  "*.authorization",
  "headers.authorization",
  "req.headers.authorization",
  "headers.x-api-key",
  "*.headers.authorization",
  "*.headers.x-api-key",
  "headers.x-integration-key",
  "req.headers.x-integration-key",
  "*.headers.x-integration-key",
  "x-integration-key",
  "*.x-integration-key",
] as const;
