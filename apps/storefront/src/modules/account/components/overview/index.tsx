import { convertToLocale } from "@lib/util/money"
import { type HttpTypes } from "@medusajs/types"
import { LhArrow } from "@modules/common/components/lehena/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface OverviewProps {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Stat = ({ figure, unit, label }: { figure: string; unit?: string; label: string }) => (
  <div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span className="serif-display" style={{ fontSize: 44, lineHeight: 0.95 }}>
        {figure}
      </span>
      {unit ? (
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--argile-ink)", letterSpacing: "0.1em" }}
        >
          {unit}
        </span>
      ) : null}
    </div>
    <div className="eyebrow" style={{ marginTop: 8 }}>
      {label}
    </div>
  </div>
)

const Overview = ({ customer, orders }: OverviewProps) => {
  const recent = orders?.slice(0, 5) ?? []

  return (
    <div data-testid="overview-page-wrapper">
      {/* Aperçu chiffré */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 32,
          paddingBottom: 36,
          borderBottom: "1px solid var(--line)",
          marginBottom: 36,
        }}
      >
        <Stat
          figure={`${getProfileCompletion(customer)}`}
          unit="%"
          label="Profil complété"
        />
        <Stat
          figure={`${customer?.addresses?.length || 0}`}
          label={
            (customer?.addresses?.length || 0) > 1
              ? "Adresses enregistrées"
              : "Adresse enregistrée"
          }
        />
      </section>

      {/* Commandes récentes */}
      <div
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <h2
          className="serif-display"
          style={{ fontSize: 32, lineHeight: 1, margin: 0, letterSpacing: "-0.015em" }}
        >
          Commandes récentes
        </h2>
        <LocalizedClientLink
          href="/account/orders"
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--rouge)",
          }}
        >
          Toutes mes commandes
        </LocalizedClientLink>
      </div>

      {recent.length > 0 ? (
        <div data-testid="orders-wrapper">
          {recent.map((order) => (
            <LocalizedClientLink
              key={order.id}
              href={`/account/orders/details/${order.id}`}
              data-testid="order-wrapper"
              data-value={order.id}
            >
              <article
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr auto",
                  alignItems: "center",
                  gap: 16,
                  padding: "20px 0",
                  borderTop: "1px solid var(--line)",
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
                    data-testid="order-id"
                    data-value={order.display_id}
                  >
                    Nº {order.display_id}
                  </div>
                  <div
                    style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)" }}
                    data-testid="order-created-date"
                  >
                    Commande du{" "}
                    {new Date(order.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div
                  className="serif-display"
                  style={{ fontSize: 22 }}
                  data-testid="order-amount"
                >
                  {convertToLocale({
                    amount: order.total,
                    currency_code: order.currency_code,
                  })}
                </div>
                <span style={{ color: "var(--ink-mute)" }} data-testid="open-order-button">
                  <span className="sr-only">Voir la commande Nº {order.display_id}</span>
                  <LhArrow />
                </span>
              </article>
            </LocalizedClientLink>
          ))}
        </div>
      ) : (
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 16,
            color: "var(--ink-soft)",
            paddingTop: 8,
          }}
          data-testid="no-orders-message"
        >
          Vous n&apos;avez pas encore passé commande.
        </p>
      )}
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
