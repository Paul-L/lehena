import React from "react"

interface CheckboxProps {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  "data-testid"?: string
}

const CheckIcon = () => (
  <svg
    width={11}
    height={11}
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

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  "data-testid": dataTestId,
}) => {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        fontFamily: "var(--serif)",
        fontSize: 15,
        color: "var(--ink-soft)",
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onChange}
        name={name}
        data-testid={dataTestId}
        style={{
          width: 18,
          height: 18,
          border: "1px solid var(--ink)",
          borderRadius: 3,
          display: "grid",
          placeItems: "center",
          background: checked ? "var(--ink)" : "transparent",
          color: checked ? "var(--bg)" : "transparent",
          flexShrink: 0,
        }}
      >
        <CheckIcon />
      </button>
      {label}
    </label>
  )
}

export default CheckboxWithLabel
