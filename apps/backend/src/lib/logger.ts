/**
 * Structured logger built on pino. Emits JSON to stdout in prod (scraped
 * by the platform — Railway, Hetzner, Scaleway) and pretty-printed in
 * dev for human readability.
 *
 * Use `logger.child({ request_id, ... })` to bind a per-request context
 * — the request-id middleware does this and exposes the child on
 * `req.log` so route handlers can keep the correlation id.
 */
import pino, { type Logger } from "pino"

const isDev = process.env.NODE_ENV !== "production"

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "lehena-backend",
    env: process.env.NODE_ENV ?? "development",
  },
  // PII guard: redact any field literally named `email`, `password`, or
  // anything below `authorization` / `cookie` headers.
  redact: {
    paths: [
      "*.email",
      "*.password",
      "*.token",
      "*.authorization",
      "*.cookie",
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname,service,env",
        },
      }
    : undefined,
})
