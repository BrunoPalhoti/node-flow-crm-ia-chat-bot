import type { RequestHandler } from "express";
import { ZodError } from "zod";
import { recordValidationFailedWebhook } from "../../chatbot/chatbot-webhook-log.service";
import { apiSuccessResponse } from "../../../shared/http/api-success-response";
import {
  type TypebotLeadAcceptedResponse,
  typebotLeadRequestSchema,
} from "./typebot-lead.schema";
import { mapTypebotLeadNormalizedFields } from "./typebot-lead-normalize";

export const createTypebotLead: RequestHandler = async (req, res, next) => {
  try {
    const leadInput = typebotLeadRequestSchema.parse(req.body);
    const normalizedFields = mapTypebotLeadNormalizedFields(req.body, leadInput);

    console.log("leadInput:", leadInput);
    console.log("normalizedFields:", normalizedFields);

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
