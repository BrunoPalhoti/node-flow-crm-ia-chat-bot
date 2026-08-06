import "reflect-metadata";
import express, { type Express, Router } from "express";
import { correlationIdMiddleware } from "./middlewares/correlation-id.middleware";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";

export function createApp(): Express {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "flow-crm-ia-chat-bot",
      timestamp: new Date().toISOString(),
    });
  });

  const apiRouter = Router();

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
