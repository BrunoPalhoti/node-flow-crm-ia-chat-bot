import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export const correlationIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header(CORRELATION_ID_HEADER);
  const correlationId =
    incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();

  req.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  next();
};
