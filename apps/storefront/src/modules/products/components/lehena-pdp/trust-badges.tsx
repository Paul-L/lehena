import {
  LhAward,
  LhLeaf,
  LhSparkle,
  LhTruck,
} from "@modules/common/components/lehena/icons"

const ITEMS: { Icon: any; label: string; sub: string }[] = [
  { Icon: LhTruck, label: "Livraison 24–48h", sub: "Chronofresh" },
  { Icon: LhAward, label: "Maître artisan", sub: "Affiné en cave" },
  { Icon: LhLeaf, label: "Sans nitrite", sub: "Sel sec uniquement" },
  { Icon: LhSparkle, label: "Frais de port offerts", sub: "Dès 50 €" },
]

export default function LehenaTrustBadges() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 36,
      }}
    >
      {ITEMS.map(({ Icon, label, sub }) => (
        <div
          key={label}
          style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12 }}
        >
          <Icon size={16} />
          <div>
            <div style={{ fontWeight: 500 }}>{label}</div>
            <div style={{ color: "var(--ink-mute)", fontSize: 11 }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
