import { listOrders } from "@lib/data/orders"
import OrderOverview from "@modules/account/components/order-overview"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Mes commandes",
  description: "Historique de vos commandes Lehena.",
  robots: { index: false, follow: false },
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div data-testid="orders-page-wrapper">
      <div
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <h2
          className="serif-display"
          style={{
            fontSize: 32,
            lineHeight: 1,
            margin: 0,
            letterSpacing: "-0.015em",
          }}
        >
          Mes commandes
        </h2>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {orders.length} commande{orders.length > 1 ? "s" : ""}
        </div>
      </div>

      <OrderOverview orders={orders} />

      <div
        style={{
          marginTop: 64,
          paddingTop: 32,
          borderTop: "1px solid var(--line)",
        }}
      >
        <TransferRequestForm />
      </div>
    </div>
  )
}
