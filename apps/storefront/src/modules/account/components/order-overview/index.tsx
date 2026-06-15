"use client"

import { convertToLocale } from "@lib/util/money"
import { LhArrow } from "@modules/common/components/lehena/icons"
import { type HttpTypes } from "@medusajs/types"
import ReorderButton from "@modules/account/components/reorder-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

const STATUS_LABELS: Record<string, string> = {
  pending: "En préparation",
  completed: "Livrée",
  archived: "Archivée",
  canceled: "Annulée",
}

function formatDate(dt: string | Date): string {
  return new Date(dt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const [open, setOpen] = useState<string | null>(orders[0]?.id ?? null)

  if (!orders.length) {
    return (
      <div
        data-testid="no-orders-container"
        style={{
          padding: "80px 0",
          textAlign: "center",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="serif-display"
          style={{ fontSize: 32, lineHeight: 1, marginBottom: 12 }}
        >
          Aucune commande encore.
        </div>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 15,
            color: "var(--ink-soft)",
            margin: "0 0 24px",
          }}
        >
          La boutique vous attend. Goûtez la maison.
        </p>
        <LocalizedClientLink href="/store" className="btn btn-rouge">
          Découvrir la boutique <LhArrow size={14} />
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {orders.map((o, i) => {
        const isOpen = open === o.id
        const isCompleted = o.status === "completed"
        const statusLabel = STATUS_LABELS[o.status] ?? o.status
        const items = o.items ?? []
        const totalLabel = convertToLocale({
          amount: o.total,
          currency_code: o.currency_code,
        })
        return (
          <article
            key={o.id}
            style={{
              borderTop: "1px solid var(--line)",
              borderBottom:
                i === orders.length - 1 ? "1px solid var(--line)" : "none",
            }}
            data-testid="order-card"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : o.id)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr auto",
                alignItems: "center",
                padding: "20px 0",
                textAlign: "left",
                background: "transparent",
                border: 0,
                gap: 16,
              }}
            >
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-mute)",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                  data-testid="order-display-id"
                >
                  #{o.display_id}
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 16,
                    color: "var(--ink)",
                  }}
                  data-testid="order-created-at"
                >
                  Commande du {formatDate(o.created_at)}
                </div>
              </div>
              <div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isCompleted ? "var(--olive)" : "var(--rouge)",
                  }}
                >
                  ● {statusLabel}
                </span>
              </div>
              <div
                className="serif-display"
                style={{ fontSize: 22, textAlign: "right" }}
                data-testid="order-amount"
              >
                {totalLabel}
              </div>
              <div
                aria-hidden
                style={{
                  color: "var(--ink-mute)",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                  transition: "transform 200ms ease",
                  display: "inline-flex",
                }}
              >
                <LhArrow size={16} />
              </div>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: "0 0 28px",
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: 40,
                  borderTop: "1px dashed var(--line)",
                  paddingTop: 24,
                }}
              >
                <div>
                  <div className="eyebrow" style={{ marginBottom: 14 }}>
                    Articles
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {items.length === 0 && (
                      <li
                        style={{
                          fontFamily: "var(--serif)",
                          fontStyle: "italic",
                          color: "var(--ink-mute)",
                        }}
                      >
                        Aucun article.
                      </li>
                    )}
                    {items.map((it) => (
                      <li
                        key={it.id}
                        data-testid="order-item"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "var(--serif)",
                          fontSize: 15,
                          color: "var(--ink)",
                          borderBottom: "1px dotted var(--line)",
                          paddingBottom: 8,
                        }}
                      >
                        <span data-testid="item-title">
                          {it.quantity} × {it.title}
                        </span>
                        <span style={{ color: "var(--ink-mute)" }}>
                          {convertToLocale({
                            amount: it.subtotal ?? it.unit_price * it.quantity,
                            currency_code: o.currency_code,
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 14 }}>
                    Suivi
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 15,
                      color: "var(--ink)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {isCompleted
                      ? "Commande livrée."
                      : "Préparation en cours dans nos ateliers."}
                  </p>
                  <div
                    style={{
                      marginTop: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <LocalizedClientLink
                      href={`/account/orders/details/${o.id}`}
                      className="btn btn-ghost"
                      style={{
                        fontSize: 11,
                        padding: "10px 16px",
                        justifyContent: "center",
                      }}
                      data-testid="order-details-link"
                    >
                      Voir le détail
                    </LocalizedClientLink>
                    <ReorderButton
                      items={items.map((it) => ({
                        variant_id: it.variant_id,
                        quantity: it.quantity,
                        title: it.product_title,
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

export default OrderOverview
