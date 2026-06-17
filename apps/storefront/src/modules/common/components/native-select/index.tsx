import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import {
  type SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & SelectHTMLAttributes<HTMLSelectElement>

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    { placeholder = "Select...", defaultValue, className, children, ...props },
    ref
  ) => {
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    useEffect(() => {
      if (innerRef.current && innerRef.current.value === "") {
        setIsPlaceholder(true)
      } else {
        setIsPlaceholder(false)
      }
    }, [innerRef.current?.value])

    return (
      <div
        onFocus={() => innerRef.current?.focus()}
        onBlur={() => innerRef.current?.blur()}
        className={clx("relative flex items-center", className)}
        style={{
          border: "1px solid var(--line-strong)",
          background: "var(--bg)",
          color: isPlaceholder ? "var(--ink-mute)" : "var(--ink)",
        }}
      >
        <select
          ref={innerRef}
          defaultValue={defaultValue}
          {...props}
          className="appearance-none flex-1 bg-transparent border-none outline-none"
          style={{
            fontFamily: "var(--serif)",
            fontSize: 16,
            color: "inherit",
            padding: "13px 14px",
            cursor: "pointer",
          }}
        >
          <option disabled value="">
            {placeholder}
          </option>
          {children}
        </select>
        <span
          className="absolute right-4 inset-y-0 flex items-center pointer-events-none"
          style={{ color: "var(--ink-mute)" }}
        >
          <ChevronUpDown />
        </span>
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export default NativeSelect
