import { retrieveCustomer } from "@lib/data/customer"
import { listSubscriptionPlans } from "@lib/data/subscriptions"
import { buildMetadata } from "@lib/seo/metadata"
import { getBaseURL } from "@lib/util/env"
import SubscriptionPlansGrid from "@modules/subscriptions/plans-grid"

import type { Metadata } from "next"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await params
  const baseUrl = getBaseURL().replace(/\/$/, "")
  return buildMetadata({
    title: "Box mensuelle",
    description:
      "Recevez chaque mois une sélection Lehena : charcuterie sans nitrite affinée à l'atelier. Suspendez, modifiez ou annulez en un clic.",
    canonical: `${baseUrl}/${countryCode}/abonnements`,
  })
}

export default async function AbonnementsPage() {
  const [plans, customer] = await Promise.all([
    listSubscriptionPlans(),
    retrieveCustomer().catch(() => null),
  ])
  return (
    <article
      className="lh-wrap"
      style={{ padding: "clamp(48px, 8vw, 96px) 0", maxWidth: 1080 }}
    >
      <header style={{ marginBottom: 56, maxWidth: 720 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Abonnements
        </div>
        <h1
          className="serif-display"
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1.05,
            marginBottom: 18,
          }}
        >
          Une <em style={{ color: "var(--rouge)" }}>box mensuelle</em> qui vous
          suit toute l&apos;année.
        </h1>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 18,
            color: "var(--ink-soft)",
            lineHeight: 1.5,
          }}
        >
          Chaque mois, notre atelier compose une sélection de pièces affinées,
          piochée dans ce qui sort le mieux à ce moment-là. Aucun engagement de
          durée — vous pouvez mettre en pause ou annuler quand vous voulez
          depuis votre espace client.
        </p>
      </header>
      <SubscriptionPlansGrid plans={plans} isCustomer={!!customer} />
    </article>
  )
}
