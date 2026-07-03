import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
  SUBSCRIPTION_MODULE,
  type SubscriptionModuleService,
} from "../../../../modules/subscription"
import { getStripeClient } from "../../../../modules/subscription/stripe-client"

interface StripeEvent {
  id: string
  type: string
  data: { object: Record<string, unknown> }
}

/**
 * Stripe webhook receiver for subscription lifecycle events. We
 * deduplicate on `stripe_event_id` via the `subscription_event_log`
 * table so a redelivery doesn't double-process anything.
 *
 * Events handled in V1:
 *  - checkout.session.completed → create the Subscription row mirroring
 *    Stripe's, fire `subscription.created` for the welcome email
 *  - customer.subscription.updated → sync status / period dates
 *  - invoice.paid → fire `subscription.renewed` for the order workflow
 *  - invoice.payment_failed → flip status to past_due, fire email event
 *  - customer.subscription.deleted → flip to cancelled
 *
 * Unhandled events return 200 so Stripe doesn't retry indefinitely.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const stripe = await getStripeClient()
  if (!stripe) {
    logger.warn("[hooks/subscription/stripe] no Stripe configured — skipping")
    return res.status(503).json({ ok: false })
  }

  const sig = (req.headers["stripe-signature"] as string | undefined) ?? ""
  const secret = process.env.STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET
  if (!secret) {
    logger.error(
      "[hooks/subscription/stripe] STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET missing"
    )
    return res.status(503).json({ ok: false })
  }

  // The raw body is required for signature verification — Medusa's body
  // parser already gives us `req.body` as a Buffer for unknown content
  // types if we register the route as raw. In V1 we re-stringify the
  // parsed JSON, which is acceptable for a sandboxed environment but
  // MUST be revisited for production (cf. Phase 12 note).
  const raw =
    typeof req.body === "string"
      ? req.body
      : Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : JSON.stringify(req.body ?? {})

  let event: StripeEvent
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      secret
    ) as unknown as StripeEvent
  } catch (err) {
    logger.warn(
      `[hooks/subscription/stripe] signature mismatch: ${
        err instanceof Error ? err.message : err
      }`
    )
    return res.status(401).json({ ok: false })
  }

  const subService =
    req.scope.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE)
  const dupes = await subService.listSubscriptionEventLogs(
    { stripe_event_id: event.id },
    { take: 1 }
  )
  if (dupes.length > 0) {
    return res.json({ ok: true, dedup: true })
  }

  try {
    await handleEvent(event, req, subService)
    await subService.createSubscriptionEventLogs({
      stripe_event_id: event.id,
      event_type: event.type,
      outcome: "processed",
    })
  } catch (err) {
    await subService.createSubscriptionEventLogs({
      stripe_event_id: event.id,
      event_type: event.type,
      outcome: "failed",
      notes: err instanceof Error ? err.message.slice(0, 1000) : String(err),
    })
    logger.error(
      `[hooks/subscription/stripe] failed ${event.type}: ${
        err instanceof Error ? err.message : err
      }`
    )
    return res.status(500).json({ ok: false })
  }
  return res.json({ ok: true })
}

interface StripeSubObject {
  id: string
  customer: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end?: boolean
  metadata?: { lehena_customer_id?: string; lehena_plan_id?: string }
}

interface StripeCheckoutObject {
  id: string
  customer: string
  subscription: string | null
  metadata?: { lehena_customer_id?: string; lehena_plan_id?: string }
}

interface StripeInvoiceObject {
  id: string
  customer: string
  subscription: string
  amount_paid?: number
}

async function handleEvent(
  event: StripeEvent,
  req: MedusaRequest,
  subService: {
    listSubscriptions: (
      f: Record<string, unknown>,
      o?: Record<string, unknown>
    ) => Promise<{ id: string; customer_id: string }[]>
    createSubscriptions: (input: Record<string, unknown>) => Promise<{
      id: string
    }>
    updateSubscriptions: (input: Record<string, unknown>) => Promise<{
      id: string
    }>
  }
) {
  switch (event.type) {
    case "checkout.session.completed": {
      const obj = event.data.object as unknown as StripeCheckoutObject
      if (!obj.subscription) return
      const meta = obj.metadata ?? {}
      const customer_id = meta.lehena_customer_id
      const plan_id = meta.lehena_plan_id
      if (!customer_id || !plan_id) return
      const existing = await subService.listSubscriptions(
        { stripe_subscription_id: obj.subscription },
        { take: 1 }
      )
      if (existing.length > 0) return
      await subService.createSubscriptions({
        customer_id,
        plan_id,
        status: "active",
        stripe_subscription_id: obj.subscription,
        stripe_customer_id: obj.customer,
      })
      const eventBus = req.scope.resolve(Modules.EVENT_BUS)
      await eventBus.emit({
        name: "subscription.created",
        data: {
          customer_id,
          plan_id,
          stripe_subscription_id: obj.subscription,
        },
      })
      break
    }
    case "customer.subscription.updated": {
      const obj = event.data.object as unknown as StripeSubObject
      const rows = await subService.listSubscriptions(
        { stripe_subscription_id: obj.id },
        { take: 1 }
      )
      if (rows.length === 0) return
      const status = mapStripeStatus(obj.status, obj.cancel_at_period_end)
      await subService.updateSubscriptions({
        id: rows[0].id,
        status,
        current_period_start: new Date(obj.current_period_start * 1000),
        current_period_end: new Date(obj.current_period_end * 1000),
        next_charge_at:
          status === "active" ? new Date(obj.current_period_end * 1000) : null,
      })
      break
    }
    case "invoice.paid": {
      const obj = event.data.object as unknown as StripeInvoiceObject
      const rows = await subService.listSubscriptions(
        { stripe_subscription_id: obj.subscription },
        { take: 1 }
      )
      if (rows.length === 0) return
      const eventBus = req.scope.resolve(Modules.EVENT_BUS)
      await eventBus.emit({
        name: "subscription.renewed",
        data: {
          subscription_id: rows[0].id,
          customer_id: rows[0].customer_id,
          amount_paid: obj.amount_paid ?? 0,
        },
      })
      break
    }
    case "invoice.payment_failed": {
      const obj = event.data.object as unknown as StripeInvoiceObject
      const rows = await subService.listSubscriptions(
        { stripe_subscription_id: obj.subscription },
        { take: 1 }
      )
      if (rows.length === 0) return
      await subService.updateSubscriptions({
        id: rows[0].id,
        status: "past_due",
      })
      const eventBus = req.scope.resolve(Modules.EVENT_BUS)
      await eventBus.emit({
        name: "subscription.payment_failed",
        data: {
          subscription_id: rows[0].id,
          customer_id: rows[0].customer_id,
        },
      })
      break
    }
    case "customer.subscription.deleted": {
      const obj = event.data.object as unknown as StripeSubObject
      const rows = await subService.listSubscriptions(
        { stripe_subscription_id: obj.id },
        { take: 1 }
      )
      if (rows.length === 0) return
      await subService.updateSubscriptions({
        id: rows[0].id,
        status: "cancelled",
        next_charge_at: null,
      })
      break
    }
  }
}

function mapStripeStatus(
  raw: string,
  cancelAtPeriodEnd?: boolean
): "active" | "paused" | "cancelled" | "past_due" | "incomplete" {
  if (cancelAtPeriodEnd) return "active" // still active until period ends
  switch (raw) {
    case "active":
    case "trialing":
      return "active"
    case "paused":
      return "paused"
    case "past_due":
      return "past_due"
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
      return "cancelled"
    default:
      return "incomplete"
  }
}
