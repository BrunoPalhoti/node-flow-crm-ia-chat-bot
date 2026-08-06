import type { RequestHandler } from "express";
import { AppError } from "../shared/errors/app-error";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError("Rota não encontrada", 404, "NOT_FOUND"));
};
