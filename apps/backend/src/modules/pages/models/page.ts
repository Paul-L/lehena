import { model } from "@medusajs/framework/utils"

export const PAGE_STATUSES = ["draft", "published"] as const

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
})

export default Page
