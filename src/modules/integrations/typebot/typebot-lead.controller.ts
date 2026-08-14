import type { RequestHandler } from "express";
import { ZodError } from "zod";
import { recordValidationFailedWebhook } from "../../chatbot/chatbot-webhook-log.service";
import { apiSuccessResponse } from "../../../shared/http/api-success-response";
import {
  type TypebotLeadAcceptedResponse,
  typebotLeadRequestSchema,
} from "./typebot-lead.schema";

export const createTypebotLead: RequestHandler = async (req, res, next) => {
  try {
    const leadInput = typebotLeadRequestSchema.parse(req.body);
    console.log("leadInput:", leadInput);

    const payload = apiSuccessResponse<TypebotLeadAcceptedResponse>(
      {
        accepted: true,
        message: "Payload do Typebot validado com sucesso",
      },
      req.correlationId,
    );

    res.status(202).json(payload);
  } catch (err) {
    console.error("Error:", err);

    if (err instanceof ZodError) {
      await recordValidationFailedWebhook({
        correlationId: req.correlationId,
        requestBody: req.body,
        statusCode: 400,
        errorMessage: "Dados inválidos",
      });
    }

    next(err);
  }
};
