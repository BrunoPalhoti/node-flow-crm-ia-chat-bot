import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_PATH: z.string().min(1).default("./data/crm.sqlite"),
  TYPEBOT_WEBHOOK_SECRET: z.string().min(1, "TYPEBOT_WEBHOOK_SECRET é obrigatório"),
  CRM_API_URL: z.string().url("CRM_API_URL deve ser uma URL válida"),
  CRM_API_KEY: z.string().min(1, "CRM_API_KEY é obrigatório"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY é obrigatório"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
