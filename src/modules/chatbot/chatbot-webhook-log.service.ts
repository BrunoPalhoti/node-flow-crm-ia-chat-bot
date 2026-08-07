import { randomUUID } from "node:crypto";
import { AppDataSource } from "../../database";
import { logger } from "../../config/logger";
import { nowUtc } from "../../shared/date/utc";
import { ChatbotWebhookLog } from "./entities/chatbot-webhook-log.entity";

export const WEBHOOK_EVENT_TYPEBOT_LEAD_UNAUTHORIZED =
  "typebot.lead.unauthorized" as const;

export const WEBHOOK_PROCESSING_REJECTED = "rejected" as const;

export type RecordUnauthorizedWebhookInput = {
  correlationId: string;
  requestBody: unknown;
  statusCode: number;
  errorMessage: string;
};

export async function recordUnauthorizedWebhook(
  input: RecordUnauthorizedWebhookInput,
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
  log.eventType = WEBHOOK_EVENT_TYPEBOT_LEAD_UNAUTHORIZED;
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
