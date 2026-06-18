import { type HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"
import { LhArrow } from "@modules/common/components/lehena/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import PaymentDetails from "@modules/order/components/payment-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import { cookies as nextCookies } from "next/headers"

interface OrderCompletedTemplateProps {
  order: HttpTypes.StoreOrder
}

const CheckMedallion = () => (
  <div
    aria-hidden="true"
    style={{
      width: 64,
      height: 64,
      borderRadius: "50%",
      border: "1px solid var(--ink)",
      display: "grid",
      placeItems: "center",
      margin: "0 auto 28px",
    }}
  >
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 12 5 5L20 6" />
    </svg>
  </div>
)

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()
  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  const firstName = order.shipping_address?.first_name?.trim()
  const orderDate = new Date(order.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <main className="lh" style={{ background: "var(--bg)", padding: "56px 0 120px" }}>
      <div className="lh-wrap-narrow">
        {isOnboarding && (
          <div style={{ marginBottom: 32 }}>
            <OnboardingCta orderId={order.id} />
          </div>
        )}

        {/* ─── Hero confirmation ─── */}
        <div
          style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}
          data-testid="order-complete-container"
        >
          <CheckMedallion />
          <div
            className="eyebrow"
            style={{ color: "var(--rouge)", marginBottom: 16 }}
          >
            Commande confirmée · Nº{" "}
            <span data-testid="order-id">{order.display_id}</span>
          </div>
          <h1
            className="serif-display"
            style={{
              fontSize: "clamp(40px, 6vw, 76px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              margin: "0 0 24px",
            }}
          >
            Merci{firstName ? `, ${firstName}` : ""}
            <span style={{ color: "var(--rouge)" }}>.</span>
          </h1>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 18,
              lineHeight: 1.6,
              color: "var(--ink-soft)",
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            Un email de confirmation part vers{" "}
            <strong style={{ fontWeight: 500, color: "var(--ink)" }} data-testid="order-email">
              {order.email}
            </strong>
            . Commande passée le {orderDate} — nous la préparons avec soin à
            l&apos;atelier.
          </p>
        </div>

        {/* ─── Carte détails ─── */}
        <div
          style={{
            maxWidth: 760,
            margin: "48px auto 0",
            border: "1px solid var(--line)",
            background: "var(--bg-elevated)",
            padding: "clamp(24px, 4vw, 40px)",
          }}
        >
          <h2
            className="serif-display"
            style={{ fontSize: 26, margin: "0 0 8px", letterSpacing: "-0.01em" }}
          >
            Récapitulatif
          </h2>
          <Items order={order} />
          <div style={{ marginTop: 8 }}>
            <CartTotals totals={order} />
          </div>
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>

        {/* ─── Actions ─── */}
        <div
          style={{
            maxWidth: 760,
            margin: "24px auto 0",
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <LocalizedClientLink href="/account/orders">
            <button className="btn btn-solid" style={{ padding: "13px 22px" }}>
              Suivre ma commande <LhArrow />
            </button>
          </LocalizedClientLink>
          <LocalizedClientLink href="/store">
            <button className="btn btn-ghost" style={{ padding: "13px 22px" }}>
              Continuer mes achats
            </button>
          </LocalizedClientLink>
        </div>
      </div>
    </main>
  )
}
