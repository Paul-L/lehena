import { model } from "@medusajs/framework/utils"

export const PAGE_STATUSES = ["draft", "published"] as const
export const PAGE_TYPES = ["page", "article", "recipe", "news"] as const

const Page = model.define("page", {
  id: model.id().primaryKey(),
  slug: model.text(),
  title: model.text(),
  content: model.json().nullable(),
  excerpt: model.text().nullable(),
  meta_title: model.text().nullable(),
  meta_description: model.text().nullable(),
  og_image_url: model.text().nullable(),
  noindex: model.boolean().default(false),
  canonical_override: model.text().nullable(),
  status: model.enum(["draft", "published"]).default("draft"),
  published_at: model.dateTime().nullable(),
  locale: model.text().default("fr"),
  translation_group_id: model.text().nullable(),
  /** Editorial type — distinguishes evergreen pages from blog articles. */
  type: model.enum(["page", "article", "recipe", "news"]).default("page"),
  /** Author id (links to the Author module). Nullable for evergreen pages. */
  author_id: model.text().nullable(),
  /** Flat list of tags — searchable but not relational in V1. */
  tags: model.json().nullable(),
  /**
   * Pillar slug this article supports (e.g. "jambon-sans-nitrite"). Used
   * by the editorial layer to surface "more on this topic" links. Pillar
   * pages themselves carry their own slug here for hub-and-spoke discovery.
   */
  pillar_slug: model.text().nullable(),
  /**
   * JSON array of `{ question: string, answer: string }`. Rendered as a
   * visible accordion on the storefront and mirrored into a FAQPage schema.
   * Nullable — most pages carry no FAQ. Placeholder answers ("À rédiger…")
   * are filtered out before the schema is emitted (cf. SEO 06).
   */
  faq: model.json().nullable(),
})

export default Page
