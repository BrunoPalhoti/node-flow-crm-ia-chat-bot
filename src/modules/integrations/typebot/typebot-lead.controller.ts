import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../../shared/http/api-success-response";
import {
  type TypebotLeadAcceptedResponse,
  typebotLeadRequestSchema,
} from "./typebot-lead.schema";

export const createTypebotLead: RequestHandler = (req, res, next) => {
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
    next(err);
  }
};
