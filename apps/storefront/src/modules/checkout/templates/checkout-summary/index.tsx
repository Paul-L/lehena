import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const TruckIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 6h13v11H2zM15 10h4l3 3v4h-7z" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
)
const LockIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <rect x="4" y="10" width="16" height="11" rx="1.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)
const CheckIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4 12 5 5L20 6" />
  </svg>
)

const REASSURANCE: [React.ReactNode, string][] = [
  [<TruckIcon key="t" />, "Chaîne du froid garantie de l'atelier à votre porte"],
  [<LockIcon key="l" />, "Paiement chiffré · aucune donnée carte stockée"],
  [<CheckIcon key="c" />, "Frais de port offerts dès 50 € d'achat"],
]

const CheckoutSummary = ({ cart }: { cart: any }) => {
  return (
    <div
      className="checkout-recap"
      style={{
        position: "sticky",
        top: 24,
        border: "1px solid var(--line)",
        background: "var(--bg-elevated)",
      }}
    >
      <div
        style={{
          padding: "22px 24px 16px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="eyebrow">Récapitulatif</div>
        <LocalizedClientLink
          href="/cart"
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--rouge)",
          }}
        >
          Modifier
        </LocalizedClientLink>
      </div>

      <div style={{ padding: "4px 24px" }}>
        <ItemsPreviewTemplate cart={cart} />
      </div>

      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--line)" }}>
        <DiscountCode cart={cart} />
      </div>

      <div style={{ padding: "18px 24px 22px", borderTop: "1px solid var(--line)" }}>
        <CartTotals totals={cart} />
      </div>

      <div
        style={{
          padding: "18px 24px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {REASSURANCE.map(([icon, label], i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontFamily: "var(--serif)",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            <span style={{ color: "var(--rouge)", flexShrink: 0 }}>{icon}</span>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CheckoutSummary
