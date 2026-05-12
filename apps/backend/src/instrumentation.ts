import * as Sentry from "@sentry/node"

/**
 * Backend Sentry initialiser. Runs at boot (Medusa imports `instrumentation.ts`
 * from the project root automatically when present). When `SENTRY_DSN` is
 * absent, no-op so dev/CI doesn't depend on a network round-trip.
 *
 * PII guard: `beforeSend` strips request headers commonly carrying auth +
 * customer email tags via `setUser` are forbidden anywhere in code.
 */
const dsn = process.env.SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip cookies + auth header from any captured request.
      if (event.request?.headers) {
        delete event.request.headers["cookie"]
        delete event.request.headers["authorization"]
      }
      return event
    },
  })
}
