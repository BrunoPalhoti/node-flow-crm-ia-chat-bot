import "reflect-metadata";
import { logger } from "../../config/logger";
import { destroyDatabase, initializeDatabase } from "../initialize";
import { seeds } from "./index";

/**
 * Runner de seeds. Adicione seeds concretos em ./index.ts conforme as entidades existirem.
 */
async function runSeeds(): Promise<void> {
  const dataSource = await initializeDatabase();

  try {
    for (const seed of seeds) {
      logger.info({ seed: seed.name }, "Running seed");
      await seed.run(dataSource);
    }

    logger.info("Seeds completed successfully");
  } finally {
    await destroyDatabase();
  }
}

runSeeds().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to run seeds");
  process.exit(1);
});
