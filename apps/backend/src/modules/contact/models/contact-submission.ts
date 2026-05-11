import { model } from "@medusajs/framework/utils"

export const CONTACT_SUBMISSION_STATUSES = [
  "new",
  "read",
  "replied",
  "spam",
] as const

const ContactSubmission = model.define("contact_submission", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  subject: model.text(),
  message: model.text(),
  /** Inbound locale (fr/es/en) — useful when responding. */
  locale: model.text().default("fr"),
  /**
   * Optional metadata: source page slug, referrer, country code. Kept as
   * arbitrary JSON so we don't have to migrate when we add new fields.
   */
  metadata: model.json().nullable(),
  status: model.enum(["new", "read", "replied", "spam"]).default("new"),
  read_at: model.dateTime().nullable(),
  replied_at: model.dateTime().nullable(),
})

export default ContactSubmission
