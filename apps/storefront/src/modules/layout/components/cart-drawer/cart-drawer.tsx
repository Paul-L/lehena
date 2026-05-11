"use client"

import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { LhArrow, LhBag, LhClose } from "@modules/common/components/lehena/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartDrawerItem from "./cart-drawer-item"
import { useCartDrawer } from "./cart-drawer-context"

const FREE_SHIPPING_THRESHOLD = 50

export default function CartDrawer({
  cart,
}: {
  cart: HttpTypes.StoreCart | null
}) {
  const { open, setOpen } = useCartDrawer()

  const items = cart?.items ?? []
  const sortedItems = [...items].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )
  const subtotal = cart?.subtotal ?? 0
  const shippingTotal = cart?.shipping_total ?? 0
  const total = cart?.total ?? subtotal
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0)
  const currencyCode = cart?.currency_code ?? "EUR"

  // Free-shipping progress (best-effort: works for EUR-style amounts).
  const subtotalDisplay = subtotal
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalDisplay)
  const progress = Math.min(100, (subtotalDisplay / FREE_SHIPPING_THRESHOLD) * 100)

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(28, 20, 16, 0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 320ms ease",
          zIndex: 80,
        }}
        aria-hidden={!open}
      />
      <aside
        aria-label="Panier"
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(460px, 100vw)",
          height: "100vh",
          background: "var(--bg-elevated)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 380ms cubic-bezier(0.32, 0.72, 0.2, 1)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-30px 0 60px rgba(0,0,0,0.18)",
        }}
      >
        <header
          style={{
            padding: "22px 28px 18px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="eyebrow">Votre panier</div>
            <div className="serif-display" style={{ fontSize: 26, marginTop: 4 }}>
              {itemCount > 0 ? `${itemCount} pièce${itemCount > 1 ? "s" : ""}` : "Vide"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            style={{ padding: 8, color: "var(--ink)" }}
          >
            <LhClose size={22} />
          </button>
        </header>

        {items.length > 0 && (
          <div style={{ padding: "14px 28px", borderBottom: "1px solid var(--line)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 8,
                fontFamily: "var(--mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
              }}
            >
              <span>
                {remaining > 0
                  ? `Plus que ${convertToLocale({ amount: remaining, currency_code: currencyCode })}`
                  : "Livraison offerte"}
              </span>
              <span>
                {convertToLocale({
                  amount: FREE_SHIPPING_THRESHOLD,
                  currency_code: currencyCode,
                })}
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: "var(--paper)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: progress >= 100 ? "var(--olive)" : "var(--rouge)",
                  transition: "width 400ms ease",
                }}
              />
            </div>
          </div>
        )}

        <div
          className="lh-no-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "8px 28px" }}
        >
          {items.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 18px",
                  borderRadius: "50%",
                  background: "var(--paper)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink-soft)",
                }}
              >
                <LhBag size={26} />
              </div>
              <div className="serif-display" style={{ fontSize: 22, marginBottom: 8 }}>
                Votre cave est vide
              </div>
              <div style={{ color: "var(--ink-mute)", fontSize: 14, marginBottom: 22 }}>
                Découvrez nos jambons affinés, salaisons et patxaran.
              </div>
              <LocalizedClientLink
                href="/store"
                onClick={() => setOpen(false)}
                className="btn btn-solid"
              >
                Visiter la boutique
              </LocalizedClientLink>
            </div>
          ) : (
            sortedItems.map((item) => (
              <CartDrawerItem
                key={item.id}
                item={item}
                currencyCode={currencyCode}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <footer
            style={{
              padding: "20px 28px 26px",
              borderTop: "1px solid var(--line)",
              background: "var(--bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--ink-soft)",
                marginBottom: 8,
              }}
            >
              <span>Sous-total</span>
              <span>
                {convertToLocale({ amount: subtotal, currency_code: currencyCode })}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--ink-soft)",
                marginBottom: 14,
              }}
            >
              <span>Livraison</span>
              <span>
                {shippingTotal === 0
                  ? "Calculée à l'étape suivante"
                  : convertToLocale({
                      amount: shippingTotal,
                      currency_code: currencyCode,
                    })}
              </span>
            </div>
            <div className="hr-strong" style={{ marginBottom: 14 }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 18,
              }}
            >
              <span className="eyebrow">Total</span>
              <span className="serif-display" style={{ fontSize: 28 }}>
                {convertToLocale({ amount: total, currency_code: currencyCode })}
              </span>
            </div>
            <LocalizedClientLink
              href="/cart"
              onClick={() => setOpen(false)}
              className="btn btn-rouge"
              style={{ width: "100%", justifyContent: "center", padding: 16 }}
            >
              Passer commande <LhArrow />
            </LocalizedClientLink>
            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "var(--ink-mute)",
                textAlign: "center",
                fontFamily: "var(--mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Paiement sécurisé · Livraison fraîche 24-48h
            </div>
          </footer>
        )}
      </aside>
      <style jsx global>{`
        @keyframes lh-flash {
          0% { background: rgba(168, 57, 37, 0.15); }
          100% { background: transparent; }
        }
        @media (max-width: 720px) {
          aside[aria-label="Panier"] { width: 100vw !important; }
        }
      `}</style>
    </>
  )
}
