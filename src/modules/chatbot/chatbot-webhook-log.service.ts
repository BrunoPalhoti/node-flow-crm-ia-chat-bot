import { randomUUID } from "node:crypto";
import { AppDataSource } from "../../database";
import { logger } from "../../config/logger";
import { nowUtc } from "../../shared/date/utc";
import { ChatbotWebhookLog } from "./entities/chatbot-webhook-log.entity";

export const WEBHOOK_EVENT_TYPEBOT_LEAD_UNAUTHORIZED =
  "typebot.lead.unauthorized" as const;

export const WEBHOOK_EVENT_TYPEBOT_LEAD_VALIDATION_FAILED =
  "typebot.lead.validation_failed" as const;

export const WEBHOOK_PROCESSING_REJECTED = "rejected" as const;

type RecordRejectedWebhookInput = {
  correlationId: string;
  requestBody: unknown;
  statusCode: number;
  errorMessage: string;
  eventType: string;
};

export type RecordUnauthorizedWebhookInput = Omit<
  RecordRejectedWebhookInput,
  "eventType"
>;

async function recordRejectedWebhook(
  input: RecordRejectedWebhookInput,
): Promise<void> {
  if (!AppDataSource.isInitialized) {
    logger.warn(
      { correlationId: input.correlationId },
      "Webhook log skipped: database not initialized",
    );
    return;
  }

  const log = new ChatbotWebhookLog();
  log.id = randomUUID();
  log.sessionId = null;
  log.eventType = input.eventType;
  log.correlationId = input.correlationId;
  log.requestPayload = JSON.stringify(input.requestBody ?? {});
  log.responsePayload = null;
  log.statusCode = input.statusCode;
  log.processingStatus = WEBHOOK_PROCESSING_REJECTED;
  log.errorMessage = input.errorMessage;
  log.receivedAt = nowUtc();

  try {
    await AppDataSource.getRepository(ChatbotWebhookLog).save(log);
  } catch (err: unknown) {
    logger.error(
      { err, correlationId: input.correlationId },
      "Failed to persist chatbot_webhook_logs entry",
    );
  }
}

export async function recordUnauthorizedWebhook(
  input: RecordUnauthorizedWebhookInput,
): Promise<void> {
  await recordRejectedWebhook({
    ...input,
    eventType: WEBHOOK_EVENT_TYPEBOT_LEAD_UNAUTHORIZED,
  });
}

export async function recordValidationFailedWebhook(
  input: RecordUnauthorizedWebhookInput,
): Promise<void> {
  await recordRejectedWebhook({
    ...input,
    eventType: WEBHOOK_EVENT_TYPEBOT_LEAD_VALIDATION_FAILED,
  });
}
