import { model } from "@medusajs/framework/utils"

// Lehena redirects — populated by handle-change subscribers (Phase 1)
// and consumed by the storefront middleware to issue 301/302 (Phase 8).
const Redirect = model.define("redirect", {
  id: model.id().primaryKey(),

  // Storefront paths, leading slash, no query string. e.g. "/produits/jambon-orhi-15-mois"
  from_path: model.text().unique(),
  to_path: model.text(),

  // HTTP status — number rather than enum to allow 302/307/308 if needed.
  status: model.number().default(301),

  // Origin of the redirect. "manual" lets admins add entries from the UI.
  source: model
    .enum(["product", "category", "page", "manual"])
    .default("manual"),
  source_id: model.text().nullable(),

  note: model.text().nullable(),
})

export default Redirect
