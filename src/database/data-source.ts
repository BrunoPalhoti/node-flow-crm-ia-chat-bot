import "reflect-metadata";
import path from "node:path";
import { DataSource } from "typeorm";
import { env } from "../config/env";

const databaseRoot = path.join(__dirname);

/**
 * DataSource único da aplicação.
 * synchronize desabilitado: o schema só muda via migrations.
 *
 * Export default único exigido pelo CLI do TypeORM (`-d`).
 */
const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: path.isAbsolute(env.DATABASE_PATH)
    ? env.DATABASE_PATH
    : path.resolve(process.cwd(), env.DATABASE_PATH),
  synchronize: false,
  migrationsRun: false,
  logging: env.NODE_ENV === "development" ? ["error", "warn", "migration"] : ["error"],
  entities: [path.join(databaseRoot, "../modules/**/entities/*.{ts,js}")],
  migrations: [path.join(databaseRoot, "migrations/*.{ts,js}")],
});

export default AppDataSource;
