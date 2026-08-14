import "reflect-metadata";
import express, { type Express, Router } from "express";
import { setupSwagger } from "./docs/swagger";
import { correlationIdMiddleware } from "./middlewares/correlation-id.middleware";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { requestLoggerMiddleware } from "./middlewares/request-logger.middleware";
import { typebotRoutes } from "./modules/integrations/typebot/typebot.routes";

export function createApp(): Express {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(express.json());

  setupSwagger(app);

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "flow-crm-ia-chat-bot",
      timestamp: new Date().toISOString(),
    });
  });

  const apiRouter = Router();
  apiRouter.use("/integrations/typebot", typebotRoutes);

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
