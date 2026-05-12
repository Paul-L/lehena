"use client"

import { mutateSubscription } from "@lib/data/subscriptions"
import { Button, toast } from "@medusajs/ui"
import { useState } from "react"

import type { Subscription, SubscriptionPlan } from "@lib/data/subscriptions"

interface Props {
  subscriptions: Subscription[]
  planById: Map<string, SubscriptionPlan>
}

const STATUS_LABEL: Record<Subscription["status"], string> = {
  incomplete: "En attente de paiement",
  active: "Active",
  paused: "En pause",
  past_due: "Paiement en échec",
  cancelled: "Annulée",
}

const STATUS_COLOR: Record<Subscription["status"], string> = {
  incomplete: "var(--ink-mute)",
  active: "var(--rouge)",
  paused: "var(--ink-mute)",
  past_due: "var(--rouge)",
  cancelled: "var(--ink-mute)",
}

export default function MySubscriptionsList({
  subscriptions,
  planById,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [items, setItems] = useState(subscriptions)

  const mutate = async (id: string, kind: "pause" | "resume" | "cancel") => {
    if (
      kind === "cancel" &&
      !window.confirm(
        "Confirmer l'annulation ? L'abonnement reste actif jusqu'à la fin du cycle en cours, puis ne sera pas renouvelé."
      )
    ) {
      return
    }
    setBusy(id)
    const res = await mutateSubscription(id, kind)
    setBusy(null)
    if (res.success) {
      // Optimistic update — the webhook will sync the real status soon.
      setItems((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status:
                  kind === "pause"
                    ? "paused"
                    : kind === "resume"
                      ? "active"
                      : s.status,
              }
            : s
        )
      )
      toast.success(
        kind === "pause"
          ? "Abonnement mis en pause."
          : kind === "resume"
            ? "Abonnement réactivé."
            : "Annulation prise en compte."
      )
    } else {
      toast.error(res.error ?? "Erreur.")
    }
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((sub) => {
        const plan = planById.get(sub.plan_id)
        const nextCharge = sub.next_charge_at
          ? new Date(sub.next_charge_at)
          : null
        return (
          <li
            key={sub.id}
            style={{
              border: "1px solid var(--line)",
              padding: 20,
              background: "var(--bg, #fff)",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: STATUS_COLOR[sub.status],
                  marginBottom: 6,
                }}
              >
                {STATUS_LABEL[sub.status].toUpperCase()}
              </div>
              <h2
                className="serif-display"
                style={{ fontSize: 22, marginBottom: 4 }}
              >
                {plan?.name ?? "Abonnement"}
              </h2>
              {plan ? (
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--ink-soft)",
                    margin: 0,
                  }}
                >
                  {plan.box_size} pièces · {(plan.price_cents / 100).toFixed(0)}{" "}
                  €/mois
                </p>
              ) : null}
              {nextCharge && sub.status === "active" ? (
                <p
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-mute)",
                    marginTop: 8,
                  }}
                >
                  PROCHAIN ENVOI : {nextCharge.toLocaleDateString("fr-FR")}
                </p>
              ) : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sub.status === "active" ? (
                <Button
                  variant="secondary"
                  size="small"
                  isLoading={busy === sub.id}
                  onClick={() => mutate(sub.id, "pause")}
                >
                  Mettre en pause
                </Button>
              ) : null}
              {sub.status === "paused" ? (
                <Button
                  variant="secondary"
                  size="small"
                  isLoading={busy === sub.id}
                  onClick={() => mutate(sub.id, "resume")}
                >
                  Reprendre
                </Button>
              ) : null}
              {sub.status !== "cancelled" ? (
                <Button
                  variant="danger"
                  size="small"
                  isLoading={busy === sub.id}
                  onClick={() => mutate(sub.id, "cancel")}
                >
                  Annuler
                </Button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
