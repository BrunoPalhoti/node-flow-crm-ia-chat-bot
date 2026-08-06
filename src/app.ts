import "reflect-metadata";
import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "flow-crm-ia-chat-bot",
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
