import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { WISHLIST_MODULE } from "../../../../modules/wishlist"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication required."
    )
  }
  const { id } = req.params
  const service = req.scope.resolve(WISHLIST_MODULE)
  // Verify ownership before deleting — never delete another customer's item.
  const items = await service.listWishlistItems(
    { id, customer_id },
    { take: 1 }
  )
  if (items.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Item not found")
  }
  await service.deleteWishlistItems(id)
  return res.json({ id, deleted: true })
}
