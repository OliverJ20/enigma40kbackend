import { pino } from "pino";
import { env, isProd } from "./env.js";

export const logger = pino({
  level: isProd ? "info" : "debug",
  // Cloud Run captures stdout JSON automatically; pretty-print only locally.
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss" },
      },
  base: {
    service: "wh40k-lists-backend",
    env: env.NODE_ENV,
  },
});
