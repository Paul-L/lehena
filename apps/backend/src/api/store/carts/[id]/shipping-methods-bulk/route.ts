import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addShippingMethodToCartWorkflow } from "@medusajs/medusa/core-flows"

import { type SetShippingMethodsBulkSchema } from "./validators"

/**
 * Sets one or more shipping methods on a cart in a single call so a mixed
 * (multi-profile) cart can satisfy every required shipping profile. The core
 * `addShippingMethodToCartWorkflow` removes the cart's existing methods and
 * adds the full `options` array, so passing all required options here yields a
 * cart with one method per profile (vs. the core single-option route, which
 * keeps only the last one).
 */
export async function POST(
  req: MedusaRequest<SetShippingMethodsBulkSchema>,
  res: MedusaResponse
) {
  const { option_ids } = req.validatedBody

  await addShippingMethodToCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      options: option_ids.map((id) => ({ id })),
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    filters: { id: req.params.id },
    fields: [
      "id",
      "shipping_methods.id",
      "shipping_methods.shipping_option_id",
      "shipping_methods.name",
      "shipping_methods.amount",
    ],
  })

  return res.json({ cart: data[0] })
}
