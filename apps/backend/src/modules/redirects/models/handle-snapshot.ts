import { model } from "@medusajs/framework/utils"

// Last-known handle for a tracked resource (product / category / page).
// The handle-change subscriber compares the current entity handle against
// this snapshot and creates a Redirect + updates the snapshot when they
// diverge. Without this table we couldn't tell a real rename apart from a
// no-op `product.updated` event.
const HandleSnapshot = model.define("handle_snapshot", {
  id: model.id().primaryKey(),
  resource_type: model.enum(["product", "category", "page"]),
  resource_id: model.text(),
  handle: model.text(),
})

export default HandleSnapshot
