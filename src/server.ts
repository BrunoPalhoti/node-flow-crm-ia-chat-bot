import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

async function bootstrap(): Promise<void> {
  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      "Server started successfully",
    );
  });
}

bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
