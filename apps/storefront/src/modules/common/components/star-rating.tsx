interface StarRatingProps {
  /** Average rating, 0..5. */
  value: number
  /** Number of reviews the average is based on. */
  count: number
  /** Star edge length in px. Default 16. */
  size?: number
  /** Show the "(4.7)" numeric value + "42 avis" label. Default true. */
  showLabel?: boolean
}

const STAR_PATH =
  "M12 2.5l2.9 5.88 6.5.94-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.06 1.11-6.47L2.6 9.9l6.5-.94L12 2.5z"

function Star({ size, filled }: { size: number; filled: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flex: "0 0 auto" }}
    >
      <path
        d={STAR_PATH}
        fill={filled ? "var(--rouge)" : "var(--ink-mute, #b0a89c)"}
      />
    </svg>
  )
}

/**
 * Accessible, stateless star rating. Renders five SVG stars, the red
 * (filled) layer clipped to the average via an overflow-hidden overlay —
 * no ids, no state, safe in a server component.
 */
export default function StarRating({
  value,
  count,
  size = 16,
  showLabel = true,
}: StarRatingProps) {
  if (count <= 0) return null

  const clamped = Math.max(0, Math.min(5, value))
  const fillPercent = (clamped / 5) * 100
  const decimal = clamped.toFixed(1).replace(".", ",")
  const countLabel = `${count} avis`
  const ariaLabel = `Note ${decimal} sur 5, basée sur ${countLabel}`

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      <span
        style={{ position: "relative", display: "inline-block", lineHeight: 0 }}
      >
        {/* Empty (muted) base layer */}
        <span style={{ display: "flex", gap: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} filled={false} />
          ))}
        </span>
        {/* Filled (red) layer, clipped horizontally to the average */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${fillPercent}%`,
            overflow: "hidden",
            whiteSpace: "nowrap",
            display: "flex",
            gap: 2,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} filled={true} />
          ))}
        </span>
      </span>
      {showLabel ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 6,
            fontSize: Math.max(11, Math.round(size * 0.72)),
            color: "var(--ink-soft, #6b6157)",
          }}
        >
          <span style={{ fontWeight: 500 }}>({decimal})</span>
          <span style={{ color: "var(--ink-mute, #b0a89c)" }}>
            {countLabel}
          </span>
        </span>
      ) : null}
    </span>
  )
}
