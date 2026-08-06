import "reflect-metadata";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { destroyDatabase, initializeDatabase } from "./database";

process.env.TZ = "UTC";

async function bootstrap(): Promise<void> {
  await initializeDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, tz: process.env.TZ },
      "Server started successfully",
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down");
    server.close(async () => {
      await destroyDatabase();
      process.exit(0);
    });
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
