/**
 * Server-side Sentry initialiser for Next.js server components + route
 * handlers. Mirrors the client config but no replays + lower trace rate.
 */
import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? "production",
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  })
}
