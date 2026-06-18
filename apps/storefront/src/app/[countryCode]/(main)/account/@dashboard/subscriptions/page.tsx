import {
  listMySubscriptions,
  listSubscriptionPlans,
} from "@lib/data/subscriptions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MySubscriptionsList from "@modules/subscriptions/my-subscriptions-list"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mes abonnements — Lehena",
  robots: { index: false, follow: false },
}

export default async function MySubscriptionsPage() {
  const [subs, plans] = await Promise.all([
    listMySubscriptions(),
    listSubscriptionPlans(),
  ])
  const planById = new Map(plans.map((p) => [p.id, p]))

  if (subs.length === 0) {
    return (
      <div className="w-full">
        <h1 className="lh-h-page mb-4">Mes abonnements</h1>
        <p className="text-sm text-ui-fg-subtle max-w-2xl mb-6">
          Vous n&apos;avez pas encore d&apos;abonnement actif. Notre box
          mensuelle est faite pour vous si vous voulez goûter régulièrement à la
          sélection de l&apos;atelier sans avoir à y penser.
        </p>
        <LocalizedClientLink
          href="/abonnements"
          className="mono"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            background: "var(--ink)",
            color: "var(--bg)",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Découvrir les box →
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="lh-h-page">Mes abonnements</h1>
        <p className="text-sm text-ui-fg-subtle max-w-2xl">
          Mettez en pause un envoi à venir, reprenez à votre rythme, ou annulez
          sans frais. La carte de paiement enregistrée pour l&apos;abonnement
          est utilisée à chaque échéance — pour la changer, démarrez un nouveau
          cycle de checkout.
        </p>
      </div>
      <MySubscriptionsList subscriptions={subs} planById={planById} />
    </div>
  )
}
