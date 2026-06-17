const Radio = ({
  checked,
  "data-testid": dataTestId,
}: {
  checked: boolean
  "data-testid"?: string
}) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      data-testid={dataTestId || "radio-button"}
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        border: "1px solid var(--ink)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        background: "transparent",
      }}
    >
      {checked && (
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "var(--ink)",
          }}
        />
      )}
    </button>
  )
}

export default Radio
