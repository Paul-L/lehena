"use client"

import React from "react"
import { useFormStatus } from "react-dom"

export function SubmitButton({
  children,
  variant = "primary",
  className,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "transparent" | "danger" | null
  className?: string
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()

  const btnClass =
    variant === "secondary" || variant === "transparent"
      ? "btn btn-ghost"
      : "btn btn-rouge"

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${btnClass}${className ? ` ${className}` : ""}`}
      data-testid={dataTestId}
      style={{
        justifyContent: "center",
        opacity: pending ? 0.6 : 1,
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "…" : children}
    </button>
  )
}
