import {
  LhAward,
  LhCheck,
  LhLeaf,
  LhSparkle,
  LhTruck,
} from "@modules/common/components/lehena/icons"

import type { ProductDetailsCatalog } from "@lib/data/product-details"
import type { ReactNode } from "react"

interface Badge {
  icon: ReactNode
  label: string
  sub: string
}

interface Props {
  /** Optional Lehena catalog details — produces dynamic badges (nitrite-free, aging, race). */
  details?: ProductDetailsCatalog | null
}

const STATIC_BADGES: Badge[] = [
  {
    icon: <LhTruck size={16} />,
    label: "Livraison 24–48h",
    sub: "Chronofresh",
  },
  {
    icon: <LhAward size={16} />,
    label: "Maître artisan",
    sub: "Affiné en cave",
  },
]

const FALLBACK_BADGES: Badge[] = [
  {
    icon: <LhLeaf size={16} />,
    label: "Sans nitrite",
    sub: "Sel sec uniquement",
  },
  {
    icon: <LhCheck size={16} />,
    label: "Frais de port offerts",
    sub: "Dès 50 €",
  },
]

function dynamicBadges(details: ProductDetailsCatalog | null): Badge[] {
  if (!details) return []
  const out: Badge[] = []
  if (details.nitrite_free) {
    out.push({
      icon: <LhLeaf size={16} />,
      label: "Sans nitrite",
      sub: "Sel sec uniquement",
    })
  }
  if (details.aging_months && details.aging_months >= 12) {
    out.push({
      icon: <LhSparkle size={16} />,
      label: `Affinage ${details.aging_months} mois`,
      sub: "Cave Lehena",
    })
  } else if (details.breed) {
    out.push({
      icon: <LhSparkle size={16} />,
      label: `Race ${details.breed}`,
      sub: details.origin,
    })
  }
  return out
}

export default function LehenaTrustBadges({ details }: Props = {}) {
  const dyn = dynamicBadges(details ?? null)
  const trailing = dyn.length === 0 ? FALLBACK_BADGES : dyn
  const items = [...STATIC_BADGES, ...trailing].slice(0, 4)

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 36,
      }}
    >
      {items.map((b) => (
        <div
          key={b.label}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--rouge)" }} aria-hidden>
            {b.icon}
          </span>
          <div>
            <div style={{ fontWeight: 500 }}>{b.label}</div>
            <div style={{ color: "var(--ink-mute)", fontSize: 11 }}>
              {b.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
