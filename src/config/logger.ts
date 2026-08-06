import pino from "pino";
import { env } from "./env";
import { REDACT_PATHS, redactCensor } from "../shared/logging/redact";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [...REDACT_PATHS],
    censor: redactCensor,
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});
