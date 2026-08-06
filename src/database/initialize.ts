import { mkdir } from "node:fs/promises";
import path from "node:path";
import { logger } from "../config/logger";
import AppDataSource from "./data-source";

/**
 * Garante o diretório do arquivo SQLite e inicializa a conexão TypeORM.
 */
export async function initializeDatabase(): Promise<typeof AppDataSource> {
  const databasePath = AppDataSource.options.database;

  if (typeof databasePath === "string" && databasePath !== ":memory:") {
    await mkdir(path.dirname(databasePath), { recursive: true });
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  logger.info(
    {
      database:
        typeof databasePath === "string" ? databasePath : ":memory:",
      driver: AppDataSource.options.type,
    },
    "Database connected",
  );

  return AppDataSource;
}

export async function destroyDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info("Database connection closed");
  }
}
