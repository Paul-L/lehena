import crypto from "crypto"

import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  NOTIFICATIONS_MODULE,
  type NotificationsModuleService,
} from "../../../../modules/notifications"

interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id?: string
    to?: string | string[]
    subject?: string
    bounce?: { type?: string; reason?: string }
    [k: string]: unknown
  }
}

const KEEP_EVENT_TYPES = new Set([
  "email.delivered",
  "email.bounced",
  "email.complained",
  "email.opened",
  "email.clicked",
])

/**
 * Resend webhook receiver. Verifies the signature (HMAC-SHA256 over the raw
 * payload, header `svix-signature` / `resend-signature` depending on
 * version), then logs the event onto the matching `email_sent_log` row so
 * ops can see bounce/complaint history per recipient.
 *
 * If RESEND_WEBHOOK_SECRET isn't set we still accept the call (open
 * webhook) so local testing works — production MUST set the secret.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const secret = process.env.RESEND_WEBHOOK_SECRET

  const raw =
    typeof req.body === "string"
      ? req.body
      : Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : JSON.stringify(req.body ?? {})

  if (secret) {
    const sigHeader =
      (req.headers["resend-signature"] as string | undefined) ??
      (req.headers["svix-signature"] as string | undefined) ??
      ""
    const expected = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex")
    // Resend signatures are sent base64; we accept either encoding to keep
    // the verifier forgiving of future format changes.
    const candidates = sigHeader.split(/[,\s]+/).map((s) => s.trim())
    const ok = candidates.some(
      (c) =>
        c === expected || c === Buffer.from(expected, "hex").toString("base64")
    )
    if (!ok) {
      logger.warn("[hooks/resend] signature mismatch — rejecting")
      return res.status(401).json({ ok: false })
    }
  }

  let event: ResendWebhookEvent
  try {
    event =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : (req.body as ResendWebhookEvent)
  } catch {
    return res.status(400).json({ ok: false })
  }

  if (!KEEP_EVENT_TYPES.has(event.type)) {
    return res.json({ ok: true })
  }

  const notif =
    req.scope.resolve<NotificationsModuleService>(NOTIFICATIONS_MODULE)
  const recipient = Array.isArray(event.data.to)
    ? event.data.to[0]
    : event.data.to
  const resend_id = event.data.email_id

  if (resend_id) {
    const rows = await notif.listEmailSentLogs({ resend_id }, { take: 1 })
    if (rows.length > 0) {
      const note = `${event.type}@${event.created_at}${
        event.data.bounce?.reason ? ` — ${event.data.bounce.reason}` : ""
      }`
      await notif.updateEmailSentLogs({
        id: rows[0].id,
        notes: [rows[0].notes, note].filter(Boolean).join(" | ").slice(0, 1000),
        status:
          event.type === "email.bounced" || event.type === "email.complained"
            ? "failed"
            : rows[0].status,
      })
    }
  }

  logger.info(
    `[hooks/resend] ${event.type} for ${recipient ?? "?"} (resend_id=${resend_id ?? "n/a"})`
  )
  return res.json({ ok: true })
}
