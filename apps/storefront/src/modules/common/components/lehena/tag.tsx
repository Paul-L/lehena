import { cn } from "@lib/util/cn"

import type { HTMLAttributes, ReactNode } from "react"

type TagVariant = "default" | "solid" | "rouge" | "soft"

interface LehenaTagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant
  icon?: ReactNode
  children: ReactNode
}

const variantClasses: Record<TagVariant, string> = {
  default: "bg-creme-elevated text-ink-soft border-line-strong",
  solid: "bg-ink text-creme border-ink",
  rouge: "bg-rouge text-white border-rouge",
  soft: "bg-terroir-grain text-ink-soft border-transparent",
}

export function LehenaTag({
  variant = "default",
  icon,
  className,
  children,
  ...rest
}: LehenaTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-circle border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </span>
  )
}
