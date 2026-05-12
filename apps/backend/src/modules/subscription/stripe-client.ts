/**
 * Thin Stripe SDK wrapper for the subscription module. Dynamic-imported
 * at call time so the `stripe` package stays out of the bundle in dev /
 * CI environments without `STRIPE_API_KEY`.
 *
 * Throws when called without an API key — every public-facing entry
 * point (route handler, webhook) checks for the key first and falls back
 * to a 503 / stub response rather than crashing.
 */

interface StripeCheckoutSession {
  id: string
  url: string | null
}

interface StripeSubscription {
  id: string
  customer: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at: number | null
  pause_collection: { behavior: string } | null
}

interface StripeClient {
  checkout: {
    sessions: {
      create(args: Record<string, unknown>): Promise<StripeCheckoutSession>
    }
  }
  subscriptions: {
    update(
      id: string,
      args: Record<string, unknown>
    ): Promise<StripeSubscription>
    cancel(
      id: string,
      args?: Record<string, unknown>
    ): Promise<StripeSubscription>
    retrieve(id: string): Promise<StripeSubscription>
  }
  webhooks: {
    constructEvent(
      payload: string | Buffer,
      header: string,
      secret: string
    ): { id: string; type: string; data: { object: unknown } }
  }
}

let cached: StripeClient | null = null

export async function getStripeClient(): Promise<StripeClient | null> {
  if (cached) return cached
  const apiKey = process.env.STRIPE_API_KEY
  if (!apiKey) return null
  const StripeModule = await import("stripe")
  const Ctor = (
    StripeModule as unknown as { default: new (key: string) => StripeClient }
  ).default
  cached = new Ctor(apiKey)
  return cached
}
