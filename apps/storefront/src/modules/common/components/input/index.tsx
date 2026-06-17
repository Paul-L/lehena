import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"
import React, { useEffect, useImperativeHandle, useState } from "react"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

/**
 * Lehena editorial field — mono uppercase label above a boxed serif input.
 * Matches the design system used across the account + checkout funnel
 * (see modules/account/components/lehena-field). Replaces the Medusa
 * floating-label style so checkout forms read like the rest of the maison.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched, required, topLabel, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <label style={{ display: "block", width: "100%" }}>
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
          {required && <span style={{ color: "var(--rouge)" }}> *</span>}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid var(--line-strong)",
            background: "var(--bg)",
            padding: "0 14px",
          }}
        >
          <input
            type={inputType}
            name={name}
            placeholder=" "
            required={required}
            style={{
              flex: 1,
              border: 0,
              background: "transparent",
              outline: "none",
              fontFamily: "var(--serif)",
              fontSize: 16,
              color: "var(--ink)",
              padding: "13px 0",
              minWidth: 0,
            }}
            {...props}
            ref={inputRef}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              style={{ color: "var(--ink-mute)", display: "grid", placeItems: "center" }}
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </label>
    )
  }
)

Input.displayName = "Input"

export default Input
