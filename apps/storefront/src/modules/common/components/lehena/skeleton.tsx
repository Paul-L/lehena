import { cn } from "@lib/util/cn"

import type { CSSProperties } from "react"

type SkeletonTone = "kraft" | "creme" | "argile" | "paper"

interface LehenaSkeletonProps {
  tone?: SkeletonTone
  className?: string
  style?: CSSProperties
  /** Renders as a circle (avatars, icon placeholders). */
  circle?: boolean
  /** Inline-block height in CSS units (default fills container). */
  height?: string | number
  /** Inline-block width in CSS units. */
  width?: string | number
  "aria-label"?: string
}

const toneClasses: Record<SkeletonTone, string> = {
  kraft: "bg-terroir-grain",
  creme: "bg-creme-elevated",
  argile: "bg-terroir-argile/30",
  paper: "bg-terroir-paper",
}

export function LehenaSkeleton({
  tone = "kraft",
  className,
  style,
  circle,
  height,
  width,
  "aria-label": ariaLabel = "Chargement",
}: LehenaSkeletonProps) {
  const inlineStyle: CSSProperties = { ...style }
  if (height !== undefined) inlineStyle.height = height
  if (width !== undefined) inlineStyle.width = width

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      className={cn(
        "relative overflow-hidden",
        toneClasses[tone],
        circle ? "rounded-full" : "rounded-soft",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:animate-[shimmer_1.6s_infinite]",
        className
      )}
      style={inlineStyle}
    />
  )
}
