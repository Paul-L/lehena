"use client"

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"

interface LehenaFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string
  suffix?: ReactNode
}

const LehenaField = forwardRef<HTMLInputElement, LehenaFieldProps>(
  ({ label, suffix, id, name, ...rest }, ref) => {
    const inputId = id ?? name
    return (
      <label htmlFor={inputId} style={{ display: "block" }}>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--ink-mute)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid var(--ink)",
            paddingBottom: 8,
          }}
        >
          <input
            ref={ref}
            id={inputId}
            name={name}
            style={{
              flex: 1,
              border: 0,
              background: "transparent",
              outline: "none",
              fontFamily: "var(--serif)",
              fontSize: 18,
              color: "var(--ink)",
              padding: 0,
              minWidth: 0,
            }}
            {...rest}
          />
          {suffix}
        </div>
      </label>
    )
  }
)

LehenaField.displayName = "LehenaField"

export default LehenaField
