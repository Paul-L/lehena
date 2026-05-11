import {
  LhAward,
  LhCheck,
  LhLeaf,
  LhSparkle,
  LhTruck,
} from "@modules/common/components/lehena/icons"

import type { ReactNode } from "react"

interface USP {
  icon: ReactNode
  label: string
  detail?: string
}

const USPS: USP[] = [
  {
    icon: <LhLeaf size={22} />,
    label: "Sans nitrite",
    detail: "Du sel, du temps",
  },
  {
    icon: <LhAward size={22} />,
    label: "Race Duroc",
    detail: "Élevage Pays Basque",
  },
  {
    icon: <LhSparkle size={20} />,
    label: "Affinage 24 mois",
    detail: "Cave de Soule",
  },
  {
    icon: <LhTruck size={22} />,
    label: "Livraison Chronofresh",
    detail: "24 – 48 h",
  },
  {
    icon: <LhCheck size={20} />,
    label: "Frais offerts",
    detail: "Dès 50 € en France",
  },
]

export default function LehenaReassuranceBar() {
  return (
    <section
      aria-label="Nos engagements de service"
      className="reveal"
      style={{
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        className="lh-wrap"
        style={{
          padding: "32px 0",
          display: "grid",
          gridTemplateColumns: `repeat(${USPS.length}, 1fr)`,
          gap: 24,
          alignItems: "center",
        }}
      >
        {USPS.map((u) => (
          <div
            key={u.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              textAlign: "center",
              color: "var(--ink-soft)",
            }}
          >
            <span aria-hidden style={{ color: "var(--rouge)" }}>
              {u.icon}
            </span>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink)",
                letterSpacing: "0.12em",
              }}
            >
              {u.label}
            </div>
            {u.detail ? (
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--serif)",
                  color: "var(--ink-mute)",
                  fontStyle: "italic",
                }}
              >
                {u.detail}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
