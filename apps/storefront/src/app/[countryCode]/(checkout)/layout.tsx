import { Logo } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="lh w-full relative small:min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      <div style={{ borderBottom: "1px solid var(--line)" }}>
        <nav className="flex h-16 items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi flex items-center gap-x-2 uppercase flex-1 basis-0"
            style={{ color: "var(--ink-soft)" }}
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus">
              Retour au panier
            </span>
            <span className="mt-px block small:hidden txt-compact-plus">
              Retour
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink href="/" data-testid="store-link">
            <Logo height={30} />
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
