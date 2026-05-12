import { Modules } from "@medusajs/framework/utils"
import React from "react"

import ContactFormEmail from "../emails/contact-form"
import { renderEmail } from "../emails/render"
import { CONTACT_MODULE } from "../modules/contact"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Forwards the contact-form submission to contact@lehena.fr (or
 * CONTACT_INBOX env override). Reply-to is the sender so the agent can
 * answer directly. Idempotent on submission id.
 */
export default async function contactSubmittedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const contactService = container.resolve(CONTACT_MODULE)
  const submission = await contactService.retrieveContactSubmission(
    event.data.id
  )
  if (!submission) return

  const inbox = process.env.CONTACT_INBOX ?? "contact@lehena.fr"
  const { html, text } = await renderEmail(
    React.createElement(ContactFormEmail, {
      sender_name: submission.name,
      sender_email: submission.email,
      subject: submission.subject,
      message: submission.message,
    })
  )
  await sendEmail(container, {
    template: "contact-form",
    dedupe_key: `contact:${submission.id}`,
    to: inbox,
    subject: `[Contact] ${submission.subject}`,
    html,
    text,
    reply_to: submission.email,
  })
}

export const config: SubscriberConfig = {
  event: "contact.submitted",
}
