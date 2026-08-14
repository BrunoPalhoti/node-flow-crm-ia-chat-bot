import type { RequestHandler } from "express";
import { env } from "../config/env";
import { recordUnauthorizedWebhook } from "../modules/chatbot/chatbot-webhook-log.service";
import { AppError } from "../shared/errors/app-error";
import { safeCompare } from "../shared/crypto/safe-compare";

export const INTEGRATION_KEY_HEADER = "x-integration-key";

const UNAUTHORIZED_MESSAGE = "Credencial ausente ou inválida";
const UNAUTHORIZED_CODE = "UNAUTHORIZED";

export const requireIntegrationKey: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    const provided = req.header(INTEGRATION_KEY_HEADER);
    const expected = env.TYPEBOT_WEBHOOK_SECRET;
    const authorized =
      typeof provided === "string" &&
      provided.length > 0 &&
      safeCompare(provided, expected);

    if (!authorized) {
      await recordUnauthorizedWebhook({
        correlationId: req.correlationId,
        requestBody: req.body,
        statusCode: 401,
        errorMessage: UNAUTHORIZED_MESSAGE,
      });

      next(new AppError(UNAUTHORIZED_MESSAGE, 401, UNAUTHORIZED_CODE));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};
