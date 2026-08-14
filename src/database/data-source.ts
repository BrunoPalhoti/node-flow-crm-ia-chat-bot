import "reflect-metadata";
import path from "node:path";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { ChatbotWebhookLog } from "../modules/chatbot/entities/chatbot-webhook-log.entity";

const databaseRoot = path.join(__dirname);

const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: path.isAbsolute(env.DATABASE_PATH)
    ? env.DATABASE_PATH
    : path.resolve(process.cwd(), env.DATABASE_PATH),
  synchronize: false,
  migrationsRun: false,
  logging:
    env.NODE_ENV === "development" ? ["error", "warn", "migration"] : ["error"],
  entities: [ChatbotWebhookLog],
  migrations: [path.join(databaseRoot, "migrations/*.{ts,js}")],
});

export default AppDataSource;
