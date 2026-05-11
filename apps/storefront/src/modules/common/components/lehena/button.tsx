import { cn } from "@lib/util/cn"
import { forwardRef } from "react"

import type { ButtonHTMLAttributes } from "react"

type ButtonVariant = "solid" | "rouge" | "outline" | "ghost" | "link"
type ButtonSize = "sm" | "md" | "lg"

interface LehenaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-sans uppercase tracking-[0.12em] font-medium rounded-circle transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50"

const variantClasses: Record<ButtonVariant, string> = {
  solid:
    "bg-ink text-creme border border-ink hover:bg-rouge hover:border-rouge",
  rouge:
    "bg-rouge text-white border border-rouge hover:bg-rouge-deep hover:border-rouge-deep",
  outline:
    "bg-transparent text-ink border border-ink hover:bg-ink hover:text-creme",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-ink/5",
  link: "bg-transparent text-ink border-0 underline underline-offset-4 px-0 py-0 hover:text-rouge",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-[11px] py-2 px-4",
  md: "text-[13px] py-3.5 px-5",
  lg: "text-[14px] py-4 px-7",
}

export const LehenaButton = forwardRef<HTMLButtonElement, LehenaButtonProps>(
  function LehenaButton(
    {
      variant = "outline",
      size = "md",
      className,
      loading,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          baseClasses,
          variantClasses[variant],
          variant !== "link" && sizeClasses[size],
          className
        )}
        {...rest}
      >
        {loading ? (
          <span
            aria-hidden
            className="inline-block h-3.5 w-3.5 animate-ring rounded-full border border-current border-t-transparent"
          />
        ) : null}
        {children}
      </button>
    )
  }
)
