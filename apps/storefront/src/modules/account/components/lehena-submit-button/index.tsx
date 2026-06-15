"use client"

import { LhArrow } from "@modules/common/components/lehena/icons"
import type { ReactNode } from "react"
import { useFormStatus } from "react-dom"

interface Props {
  children: ReactNode
  variant?: "rouge" | "solid"
  "data-testid"?: string
}

export default function LehenaSubmitButton({
  children,
  variant = "rouge",
  "data-testid": dataTestId,
}: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className={`btn ${variant === "rouge" ? "btn-rouge" : "btn-solid"}`}
      style={{ justifyContent: "center", padding: "16px 24px", marginTop: 8 }}
      disabled={pending}
      data-testid={dataTestId}
    >
      {pending ? "Un instant…" : children}
      {!pending && <LhArrow size={16} />}
    </button>
  )
}
