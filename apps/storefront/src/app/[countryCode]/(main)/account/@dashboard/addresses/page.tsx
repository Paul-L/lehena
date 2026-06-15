import { retrieveCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import AddressBook from "@modules/account/components/address-book"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Mes adresses",
  description: "Gérez vos adresses de livraison.",
  robots: { index: false, follow: false },
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div data-testid="addresses-page-wrapper">
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
        <div>
          <h2
            className="serif-display"
            style={{
              fontSize: 32,
              lineHeight: 1,
              margin: "0 0 8px",
              letterSpacing: "-0.015em",
            }}
          >
            Mes adresses
          </h2>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 15,
              color: "var(--ink-soft)",
              margin: 0,
            }}
          >
            Enregistrez vos adresses pour accélérer le passage en caisse.
          </p>
        </div>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
