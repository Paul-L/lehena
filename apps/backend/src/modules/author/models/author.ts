import { model } from "@medusajs/framework/utils"

/**
 * Editorial author / contributor. Linked from `page.author_id` for blog
 * articles, recipe authors, and press quote attributions where we want a
 * dedicated author page.
 *
 * Kept intentionally narrow in V1 — no email, no role, no admin user
 * link. The CMS team enters authors by hand from the admin.
 */
const Author = model.define("author", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  name: model.text(),
  bio: model.text().nullable(),
  photo_url: model.text().nullable(),
  /** JSON array of { platform: "instagram" | "twitter" | "linkedin", url }. */
  social_links: model.json().nullable(),
  /** Two-letter locale guiding the schema:Person language attribute. */
  locale: model.text().default("fr"),
})

export default Author
