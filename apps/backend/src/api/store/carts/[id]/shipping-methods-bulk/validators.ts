import { z } from "zod"

/**
 * Body for setting several shipping methods on a cart in ONE call. Lehena
 * splits products across two shipping profiles (fresh / ambient), and Medusa
 * requires a method per required profile at completion — but the core store
 * route `POST /store/carts/:id/shipping-methods` replaces all methods with the
 * single option it receives. This route forwards the full list to
 * `addShippingMethodToCartWorkflow`, which removes existing methods and adds
 * the whole set in one transaction.
 */
export const SetShippingMethodsBulkSchema = z.object({
  option_ids: z.array(z.string().min(1)).min(1),
})

export type SetShippingMethodsBulkSchema = z.infer<
  typeof SetShippingMethodsBulkSchema
>
