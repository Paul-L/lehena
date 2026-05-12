import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { GDPR_MODULE } from "../../../modules/gdpr"
import { WISHLIST_MODULE } from "../../../modules/wishlist"

export interface AnonymiseCustomerStepInput {
  customer_id: string
  ip?: string | null
}

/**
 * Anonymises a customer in-place: replaces PII with a stable stub
 * (deleted-<id>@lehena.fr / "Client supprimé") and hard-deletes addresses
 * and wishlist items. Orders are intentionally preserved — French
 * accounting law requires 10-year retention of commercial records.
 *
 * This is irreversible. We don't snapshot the previous values on the way
 * out, only emit an audit row in `gdpr_log`.
 */
export const anonymiseCustomerStep = createStep(
  "anonymise-customer",
  async (input: AnonymiseCustomerStepInput, { container }) => {
    const customerService = container.resolve(Modules.CUSTOMER)
    const wishlistService = container.resolve(WISHLIST_MODULE)
    const gdprService = container.resolve(GDPR_MODULE)

    const customer_id = input.customer_id

    // Hard-delete addresses (no compensation: the anonymise step is the
    // final point of no return).
    const addresses = await customerService.listCustomerAddresses({
      customer_id,
    })
    if (addresses.length > 0) {
      await customerService.deleteCustomerAddresses(addresses.map((a) => a.id))
    }

    // Hard-delete wishlist items.
    const wishItems = await wishlistService.listWishlistItems({ customer_id })
    if (wishItems.length > 0) {
      await wishlistService.deleteWishlistItems(wishItems.map((w) => w.id))
    }

    // Overwrite customer PII with a stable stub.
    await customerService.updateCustomers(customer_id, {
      email: `deleted-${customer_id}@lehena.fr`,
      first_name: "Client",
      last_name: "supprimé",
      phone: null,
      company_name: null,
      metadata: { anonymised_at: new Date().toISOString() },
    })

    await gdprService.createGdprLogs({
      customer_id,
      action: "delete_completed",
      ip: input.ip ?? null,
    })

    return new StepResponse({ customer_id })
  }
)
