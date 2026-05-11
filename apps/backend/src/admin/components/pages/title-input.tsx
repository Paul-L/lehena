import { clx, Text } from "@medusajs/ui"
import * as React from "react"

const MAX = 200

interface TitleInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  autoFocus?: boolean
}

export const TitleInput = React.forwardRef<HTMLInputElement, TitleInputProps>(
  (
    { value, onChange, error, placeholder = "Titre de la page", autoFocus },
    ref
  ) => {
    const length = value?.length ?? 0
    const overLimit = length > MAX

    return (
      <div className="flex flex-col gap-1">
        <input
          ref={ref}
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={MAX + 1}
          autoFocus={autoFocus}
          className={clx(
            "w-full bg-transparent border-0 text-2xl font-semibold text-ui-fg-base",
            "placeholder:text-ui-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-border-interactive rounded-md px-1 -mx-1"
          )}
        />
        <div className="flex items-center justify-between text-xs px-1">
          {error ? (
            <Text size="small" className="text-ui-fg-error">
              {error}
            </Text>
          ) : (
            <span />
          )}
          <Text
            size="small"
            className={clx(overLimit ? "text-ui-fg-error" : "text-ui-fg-muted")}
          >
            {length} / {MAX}
          </Text>
        </div>
      </div>
    )
  }
)

TitleInput.displayName = "TitleInput"
