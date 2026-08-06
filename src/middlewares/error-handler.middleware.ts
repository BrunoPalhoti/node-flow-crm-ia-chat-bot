import type { ErrorRequestHandler } from "express";
import { ZodError, z } from "zod";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../shared/errors/app-error";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
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
      },
    });
    return;
  }

  logger.error({ err }, "Unhandled error");

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "Erro interno do servidor"
          : err instanceof Error
            ? err.message
            : "Erro interno do servidor",
    },
  });
};