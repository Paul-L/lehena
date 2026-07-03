import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  WISHLIST_MODULE,
  type WishlistModuleService,
} from "../../../modules/wishlist"
import { addWishlistItemWorkflow } from "../../../workflows/wishlist"

import { type AddWishlistItemSchema } from "./validators"

function requireCustomerId(req: AuthenticatedMedusaRequest): string {
  const id = req.auth_context?.actor_id
  if (!id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication required."
    )
  }
  return id
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customer_id = requireCustomerId(req)
  const service = req.scope.resolve<WishlistModuleService>(WISHLIST_MODULE)
  const items = await service.listWishlistItems(
    { customer_id },
    { order: { created_at: "DESC" }, take: 200 }
  )
  return res.json({ items })
}

export async function POST(
  req: AuthenticatedMedusaRequest<AddWishlistItemSchema>,
  res: MedusaResponse
) {
  const customer_id = requireCustomerId(req)
  const { product_id, variant_id } = req.validatedBody
  try {
    const { result } = await addWishlistItemWorkflow(req.scope).run({
      input: { customer_id, product_id, variant_id },
    })
    return res.json({ item: result })
  } catch (err) {
    if (
      err instanceof MedusaError &&
      err.type === MedusaError.Types.DUPLICATE_ERROR
    ) {
      // Treat duplicate adds as a no-op success (UX-friendly).
      return res.json({ item: null, duplicate: true })
    }
    throw err
  }
}
