import type { ErrorRequestHandler } from "express";
import { ZodError, z } from "zod";
import { logger } from "../config/logger";
import { AppError } from "../shared/errors/app-error";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const { correlationId } = req;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
        correlationId,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos",
        details: z.flattenError(err),
        correlationId,
      },
    });
    return;
  }

  logger.error({ err, correlationId }, "Unhandled error");

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro interno do servidor",
      correlationId,
    },
  });
};
