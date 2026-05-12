import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { INVOICE_MODULE } from "../../../../../modules/invoice"

/**
 * Lists invoices for the authenticated customer. Cross-references the
 * customer's orders via the order module so we never leak invoices belonging
 * to another customer (even if a malicious caller forges an order_id).
 */
export async function GET(
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

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id"],
    filters: { customer_id },
  })
  const orderIds = (orders ?? []).map((o) => o.id)
  if (orderIds.length === 0) {
    return res.json({ invoices: [] })
  }

  const invoiceService = req.scope.resolve(INVOICE_MODULE)
  const invoices = await invoiceService.listInvoices(
    { order_id: orderIds },
    { order: { created_at: "DESC" }, take: 100 }
  )

  return res.json({ invoices })
}
