import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Paiement",
  description: "Finalisez votre commande — Maison Lehena.",
  robots: { index: false, follow: false },
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="content-container py-12">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div className="eyebrow">Commande</div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-soft)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="1.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Paiement chiffré SSL
        </div>
      </div>
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] gap-x-40">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
