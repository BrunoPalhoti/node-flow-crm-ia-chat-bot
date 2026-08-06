import { RequestHandler } from "express";
import { AppError } from "../shared/errors/app-error";

export const notFoundHandler: RequestHandler = (req, res, next) => {
    next(new AppError('Route not found', 404, 'NOT_FOUND'));
}