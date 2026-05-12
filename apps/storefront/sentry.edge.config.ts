/**
 * Edge runtime Sentry initialiser (middleware, Edge route handlers).
 * Keeps the surface area narrow — Edge can't carry the full Node SDK.
 */
import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? "production",
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.05,
    sendDefaultPii: false,
  })
}
