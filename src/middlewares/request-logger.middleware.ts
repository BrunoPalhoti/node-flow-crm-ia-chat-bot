import type { RequestHandler } from "express";
import { logger } from "../config/logger";

/**
 * Loga entrada e conclusão de cada requisição:
 * método, rota, status, duração (ms) e Correlation ID.
 */
export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  const { method, correlationId } = req;
  const route = req.originalUrl.split("?")[0] ?? req.path;

  logger.info({ correlationId, method, route }, "Request started");

  res.on("finish", () => {
    const durationMs =
      Math.round(Number(process.hrtime.bigint() - startedAt) / 1e4) / 100;

    logger.info(
      {
        correlationId,
        method,
        route,
        statusCode: res.statusCode,
        durationMs,
      },
      "Request completed",
    );
  });

  next();
};
