import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  INVOICE_MODULE,
  type InvoiceModuleService,
} from "../../../modules/invoice"
import {
  renderInvoicePdf,
  type InvoiceData,
} from "../../../modules/invoice/pdf-template"

export interface GenerateInvoiceStepInput {
  order_id: string
}

const pad = (n: number, len: number) => n.toString().padStart(len, "0")

export const generateInvoiceStep = createStep(
  "generate-invoice",
  async (input: GenerateInvoiceStepInput, { container }) => {
    const invoiceService =
      container.resolve<InvoiceModuleService>(INVOICE_MODULE)
    const orderService = container.resolve(Modules.ORDER)
    const fileService = container.resolve(Modules.FILE)

    // Idempotency: skip if an invoice already exists for this order.
    const existing = await invoiceService.listInvoices({
      order_id: input.order_id,
    })
    if (existing.length > 0) {
      return new StepResponse(existing[0], null)
    }

    const order = await orderService.retrieveOrder(input.order_id, {
      relations: ["items", "shipping_address", "billing_address"],
    })
    if (!order) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
    }

    // Sequential numbering per year. `count` returns current rows, so the
    // next number is `count + 1`. The unique index on `number` makes the
    // race window self-healing — a colliding insert throws, the workflow
    // retries with a fresh count.
    const year = new Date().getFullYear()
    const yearCount = (await invoiceService.listInvoices({ year }, { take: 0 }))
      .length
    const seq = yearCount + 1
    const number = `${year}-${pad(seq, 6)}`

    const data: InvoiceData = {
      number,
      issued_at: new Date().toISOString(),
      order_display_id: order.display_id ?? null,
      customer: {
        first_name: order.shipping_address?.first_name ?? null,
        last_name: order.shipping_address?.last_name ?? null,
        email: order.email ?? "",
      },
      billing_address: order.billing_address
        ? {
            address_1: order.billing_address.address_1,
            address_2: order.billing_address.address_2,
            city: order.billing_address.city,
            postal_code: order.billing_address.postal_code,
            province: order.billing_address.province,
            country_code: order.billing_address.country_code,
          }
        : null,
      items: (order.items ?? []).map((it) => ({
        title: it.product_title || it.title || "Produit",
        quantity: Number(it.quantity ?? 1),
        unit_price: Number(it.unit_price ?? 0),
        total: Number(it.subtotal ?? 0),
      })),
      subtotal: Number(order.item_subtotal ?? order.subtotal ?? 0),
      shipping_total: Number(order.shipping_subtotal ?? 0),
      tax_total: Number(order.tax_total ?? 0),
      total: Number(order.total ?? 0),
      currency_code: order.currency_code ?? "eur",
    }

    const pdf = await renderInvoicePdf(data)

    const [uploaded] = await fileService.createFiles([
      {
        filename: `invoice-${number}.pdf`,
        mimeType: "application/pdf",
        content: pdf.toString("binary"),
      },
    ])

    const invoice = await invoiceService.createInvoices({
      order_id: input.order_id,
      number,
      year,
      amount: data.total,
      currency_code: data.currency_code,
      storage_url: uploaded.url,
    })
    return new StepResponse(invoice, invoice.id)
  },
  async (id, { container }) => {
    if (!id) return
    const invoiceService =
      container.resolve<InvoiceModuleService>(INVOICE_MODULE)
    await invoiceService.deleteInvoices(id)
  }
)
