"use client"

import { LhTruck } from "@modules/common/components/lehena/icons"
import { useEffect, useState } from "react"

interface Props {
  /** Conservation profile from product_details. Drives the shipping copy. */
  conservationTemp?: "ambient" | "fresh" | "frozen"
}

const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
]
const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
]

/** Order cutoff: 12:00 Europe/Paris. After that, expedition slides one day. */
const CUTOFF_HOUR = 12

function formatDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return d
}

interface Estimate {
  cutoffLabel: string
  deliveryRange: string
  isFresh: boolean
}

/**
 * Client-side render of the shipping ETA. Reads `Date.now()` at mount so
 * the SSR/CSR diff doesn't trip hydration on the first paint.
 */
export default function LehenaPDPDeliveryEstimate({
  conservationTemp = "ambient",
}: Props) {
  const [estimate, setEstimate] = useState<Estimate | null>(null)

  useEffect(() => {
    const now = new Date()
    const beforeCutoff = now.getHours() < CUTOFF_HOUR
    // Fresh (Chronofresh): expedition day = today if before cutoff, else tomorrow.
    // Delivery = expedition + 1 to 2 business days.
    const isFresh =
      conservationTemp === "fresh" || conservationTemp === "frozen"
    const expDayOffset = beforeCutoff ? 0 : 1
    const expedition = addBusinessDays(now, expDayOffset)
    const dStart = addBusinessDays(expedition, isFresh ? 1 : 2)
    const dEnd = addBusinessDays(dStart, 1)

    const cutoffLabel = beforeCutoff
      ? `Commandez avant ${CUTOFF_HOUR}h pour une expédition aujourd'hui.`
      : `Commandez avant demain ${CUTOFF_HOUR}h pour une expédition rapide.`
    const deliveryRange = `Livraison estimée entre ${formatDate(
      dStart
    )} et ${formatDate(dEnd)}.`

    setEstimate({ cutoffLabel, deliveryRange, isFresh })
  }, [conservationTemp])

  if (!estimate) {
    // Skeleton-ish space so we don't shift layout.
    return (
      <div
        style={{
          padding: 16,
          border: "1px solid var(--line)",
          background: "var(--bg-elevated)",
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--ink-mute)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Estimation de livraison…
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 16,
        border: "1px solid var(--line-strong)",
        background: "var(--bg-elevated)",
      }}
    >
      <span style={{ color: "var(--rouge)" }} aria-hidden>
        <LhTruck size={22} />
      </span>
      <div>
        <div
          className="mono"
          style={{
            color: "var(--ink-mute)",
            fontSize: 10,
            marginBottom: 4,
            letterSpacing: "0.1em",
          }}
        >
          {estimate.isFresh ? "Livraison Chronofresh" : "Livraison Colissimo"}
        </div>
        <div
          className="serif"
          style={{
            fontSize: 15,
            color: "var(--ink)",
            lineHeight: 1.35,
          }}
        >
          {estimate.deliveryRange}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "var(--ink-mute)",
            fontStyle: "italic",
            fontFamily: "var(--serif)",
          }}
        >
          {estimate.cutoffLabel}
        </div>
      </div>
    </div>
  )
}
