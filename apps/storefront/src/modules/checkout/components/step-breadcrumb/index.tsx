"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type StepKey = "address" | "delivery" | "payment" | "review"

interface Step {
  key: StepKey
  label: string
  /** Reachable only once this predicate matches the current cart state. */
  isReady: (cart: {
    shipping_address?: { address_1?: string | null } | null
    shipping_methods?: { id: string }[] | null
    payment_collection?: { payment_sessions?: { id: string }[] | null } | null
  }) => boolean
}

const STEPS: Step[] = [
  {
    key: "address",
    label: "Livraison",
    isReady: () => true, // Always reachable.
  },
  {
    key: "delivery",
    label: "Mode d'envoi",
    isReady: (c) => Boolean(c.shipping_address?.address_1),
  },
  {
    key: "payment",
    label: "Paiement",
    isReady: (c) => (c.shipping_methods?.length ?? 0) > 0,
  },
  {
    key: "review",
    label: "Récapitulatif",
    isReady: (c) =>
      Boolean(c.payment_collection?.payment_sessions?.length ?? 0),
  },
]

interface Props {
  cart: {
    shipping_address?: { address_1?: string | null } | null
    shipping_methods?: { id: string }[] | null
    payment_collection?: { payment_sessions?: { id: string }[] | null } | null
  }
}

/**
 * Checkout tunnel breadcrumb. Renders four pill steps; clicking a step that
 * is `isReady` jumps to it via `?step=`. The non-ready steps stay visually
 * muted and aren't focusable.
 *
 * Step state is derived purely from the cart object so we don't need a
 * separate state machine — Medusa's cart is the single source of truth.
 */
export default function StepBreadcrumb({ cart }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const currentStep = (search.get("step") as StepKey | null) ?? "address"

  const completed = (key: StepKey): boolean => {
    const idx = STEPS.findIndex((s) => s.key === key)
    const curIdx = STEPS.findIndex((s) => s.key === currentStep)
    return idx < curIdx && STEPS[idx]!.isReady(cart)
  }

  const goto = (key: StepKey) => {
    router.push(`${pathname}?step=${key}`, { scroll: false })
  }

  return (
    <nav
      aria-label="Étapes de commande"
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 28,
      }}
    >
      {STEPS.map((s, i) => {
        const isActive = s.key === currentStep
        const isComplete = completed(s.key)
        const ready = s.isReady(cart)
        return (
          <button
            key={s.key}
            type="button"
            onClick={ready ? () => goto(s.key) : undefined}
            aria-current={isActive ? "step" : undefined}
            aria-disabled={!ready}
            disabled={!ready}
            className="mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: `1px solid ${
                isActive ? "var(--ink, #2a1f17)" : "var(--line, #e7e1d5)"
              }`,
              background: isActive
                ? "var(--ink, #2a1f17)"
                : "var(--bg, transparent)",
              color: isActive
                ? "var(--bg, #fff)"
                : ready
                  ? "var(--ink, #2a1f17)"
                  : "var(--ink-mute, #9a8e7d)",
              cursor: ready ? "pointer" : "not-allowed",
              opacity: ready ? 1 : 0.5,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: isComplete
                  ? "var(--rouge, #b3402a)"
                  : "transparent",
                border: isComplete
                  ? "1px solid var(--rouge, #b3402a)"
                  : "1px solid currentColor",
                fontSize: 10,
                color: isComplete ? "#fff" : "currentColor",
              }}
            >
              {isComplete ? <CheckCircleSolid /> : i + 1}
            </span>
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}
