"use client"

import React from "react"

const CheckIcon = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m4 12 5 5L20 6" />
  </svg>
)

/**
 * Editorial step heading for the checkout tunnel — a numbered medallion
 * (filled with a check once done), a serif-display title, and an optional
 * "Modifier" affordance. Shared by Addresses / Shipping / Payment / Review
 * so the funnel reads as one accordion in the Lehena design language.
 */
export default function StepHeading({
  num,
  label,
  done = false,
  active = false,
  locked = false,
  onEdit,
  editTestId,
}: {
  num: number
  label: string
  done?: boolean
  active?: boolean
  locked?: boolean
  onEdit?: () => void
  editTestId?: string
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: active ? 24 : 0,
        opacity: locked ? 0.45 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "1px solid var(--ink)",
            display: "grid",
            placeItems: "center",
            background: done ? "var(--ink)" : "transparent",
            color: done ? "var(--bg)" : "var(--ink)",
            flexShrink: 0,
          }}
        >
          {done ? (
            <CheckIcon />
          ) : (
            <span className="mono" style={{ fontSize: 11 }}>
              {String(num).padStart(2, "0")}
            </span>
          )}
        </span>
        <h2
          className="serif-display"
          style={{ fontSize: 24, margin: 0, letterSpacing: "-0.01em" }}
        >
          {label}
        </h2>
      </div>
      {done && !active && onEdit && (
        <button
          onClick={onEdit}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--rouge)",
          }}
          data-testid={editTestId}
        >
          Modifier
        </button>
      )}
    </div>
  )
}
