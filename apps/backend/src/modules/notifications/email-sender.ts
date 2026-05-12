import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { NOTIFICATIONS_MODULE } from "./index"

import type { MedusaContainer } from "@medusajs/framework/types"

export interface SendEmailInput {
  /** Logical template name (matches the React component filename). */
  template: string
  /** Deduplication key — typically order/cart/customer id. */
  dedupe_key: string
  /** Final recipient address. Will be overridden in dev mode. */
  to: string
  subject: string
  /** Rendered HTML body. */
  html: string
  /** Optional plain-text fallback. */
  text?: string
  /** Optional reply-to override. */
  reply_to?: string
  /** Optional PDF attachments. */
  attachments?: { filename: string; content: Buffer | string }[]
}

export interface SendEmailResult {
  status: "sent" | "skipped" | "failed"
  resend_id: string | null
  notes?: string
}

interface ResendSdk {
  emails: {
    send(args: {
      from: string
      to: string | string[]
      subject: string
      html: string
      text?: string
      reply_to?: string
      attachments?: { filename: string; content: string | Buffer }[]
    }): Promise<{ data?: { id?: string } | null; error?: unknown }>
  }
}

let cachedClient: ResendSdk | null = null

async function getResendClient(): Promise<ResendSdk | null> {
  if (cachedClient) return cachedClient
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  // Dynamic import keeps the resend SDK out of the bundle when no key is
  // configured (dev / CI default).
  const { Resend } = await import("resend")
  cachedClient = new Resend(apiKey) as unknown as ResendSdk
  return cachedClient
}

function isDevRedirectActive(): boolean {
  return process.env.RESEND_DEV_MODE === "true"
}

function devRedirectAddress(): string {
  return process.env.RESEND_DEV_REDIRECT ?? "paul+dev@lehena.fr"
}

const FROM_DEFAULT = "Maison Lehena <hello@lehena.fr>"

/**
 * Sends an email via Resend with idempotency, dev-mode redirect, and graceful
 * fallback when no API key is configured.
 *
 * Three failure modes are treated specifically:
 *   1. Already-sent (dedupe_key collision) → `skipped`, no second send.
 *   2. No RESEND_API_KEY → logged + recorded as `skipped`. Subscribers stay
 *      functional in dev / CI.
 *   3. Resend returns an error → recorded as `failed`, the error message
 *      logged. We do NOT throw — email failures must not break critical
 *      workflows (e.g. order placement).
 */
export async function sendEmail(
  container: MedusaContainer,
  input: SendEmailInput
): Promise<SendEmailResult> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notif = container.resolve(NOTIFICATIONS_MODULE)

  // 1. Idempotency check.
  const existing = await notif.listEmailSentLogs({
    template: input.template,
    dedupe_key: input.dedupe_key,
    status: "sent",
  })
  if (existing.length > 0) {
    logger.info(
      `[email] skip "${input.template}" — already sent for ${input.dedupe_key}`
    )
    return { status: "skipped", resend_id: null, notes: "duplicate" }
  }

  const recipient = isDevRedirectActive() ? devRedirectAddress() : input.to
  const subjectPrefix = isDevRedirectActive() ? `[DEV→${input.to}] ` : ""
  const finalSubject = subjectPrefix + input.subject

  const client = await getResendClient()
  if (!client) {
    // No key — stub mode. Log the email URL+meta so QA can still trace.
    logger.info(
      `[email] STUB ${input.template} to ${recipient} — subject: "${finalSubject}"`
    )
    await notif.createEmailSentLogs({
      template: input.template,
      dedupe_key: input.dedupe_key,
      recipient,
      resend_id: null,
      status: "skipped",
      notes: "no RESEND_API_KEY",
    })
    return { status: "skipped", resend_id: null, notes: "no api key" }
  }

  try {
    const res = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL
        ? `Maison Lehena <${process.env.RESEND_FROM_EMAIL}>`
        : FROM_DEFAULT,
      to: recipient,
      subject: finalSubject,
      html: input.html,
      text: input.text,
      reply_to: input.reply_to,
      attachments: input.attachments,
    })

    const resendId = res.data?.id ?? null
    if (res.error) {
      const message =
        res.error instanceof Error ? res.error.message : String(res.error)
      logger.error(
        `[email] failed ${input.template} to ${recipient}: ${message}`
      )
      await notif.createEmailSentLogs({
        template: input.template,
        dedupe_key: input.dedupe_key,
        recipient,
        resend_id: resendId,
        status: "failed",
        notes: message.slice(0, 1000),
      })
      return { status: "failed", resend_id: resendId, notes: message }
    }

    await notif.createEmailSentLogs({
      template: input.template,
      dedupe_key: input.dedupe_key,
      recipient,
      resend_id: resendId,
      status: "sent",
    })
    logger.info(
      `[email] sent ${input.template} to ${recipient} (resend_id=${resendId ?? "n/a"})`
    )
    return { status: "sent", resend_id: resendId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(
      `[email] crashed ${input.template} to ${recipient}: ${message}`
    )
    await notif.createEmailSentLogs({
      template: input.template,
      dedupe_key: input.dedupe_key,
      recipient,
      resend_id: null,
      status: "failed",
      notes: message.slice(0, 1000),
    })
    return { status: "failed", resend_id: null, notes: message }
  }
}
