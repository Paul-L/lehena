import * as React from "react"
import { clx, IconButton, Input, Text, Tooltip } from "@medusajs/ui"
import { Check, Loader2, Lock, Unlock, XCircle } from "lucide-react"
import { useDebouncedValue } from "../../hooks/use-debounced-value"
import { useCheckSlugAvailability } from "../../hooks/use-pages"
import {
  PAGE_RESERVED_SLUGS,
  PAGE_SLUG_REGEX,
} from "./page-form-schema"

type SlugInputProps = {
  value: string
  onChange: (value: string) => void
  /**
   * When true, the slug is "locked": auto-generation from the title is
   * disabled. Click the lock icon to toggle.
   */
  locked: boolean
  onLockChange: (locked: boolean) => void
  /**
   * If editing an existing page, pass its id so the uniqueness check
   * doesn't flag the page's own slug as a collision.
   */
  excludeId?: string
  /** Storefront base URL prefix shown before the slug. */
  prefix?: string
}

type ValidationState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "error"; message: string }

export const SlugInput: React.FC<SlugInputProps> = ({
  value,
  onChange,
  locked,
  onLockChange,
  excludeId,
  prefix = "monsite.com/",
}) => {
  const debouncedSlug = useDebouncedValue(value, 500)
  const slugCheck = useCheckSlugAvailability(debouncedSlug, excludeId)

  const validation: ValidationState = React.useMemo(() => {
    if (!value) return { kind: "idle" }
    if (!PAGE_SLUG_REGEX.test(value)) {
      return {
        kind: "error",
        message: "Format invalide (kebab-case : a-z, 0-9, tirets)",
      }
    }
    if (
      PAGE_RESERVED_SLUGS.includes(
        value as (typeof PAGE_RESERVED_SLUGS)[number]
      )
    ) {
      return { kind: "error", message: "Slug réservé" }
    }
    if (debouncedSlug !== value || slugCheck.isFetching) {
      return { kind: "checking" }
    }
    if (slugCheck.data && !slugCheck.data.available) {
      return { kind: "error", message: "Slug déjà utilisé" }
    }
    if (slugCheck.data?.available) {
      return { kind: "ok" }
    }
    return { kind: "idle" }
  }, [value, debouncedSlug, slugCheck.data, slugCheck.isFetching])

  const Icon = (() => {
    switch (validation.kind) {
      case "checking":
        return (
          <Loader2 className="h-4 w-4 text-ui-fg-muted animate-spin" />
        )
      case "ok":
        return <Check className="h-4 w-4 text-ui-tag-green-icon" />
      case "error":
        return <XCircle className="h-4 w-4 text-ui-fg-error" />
      default:
        return null
    }
  })()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!locked) onLockChange(true)
    onChange(e.target.value)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Text size="small" className="text-ui-fg-subtle shrink-0">
          {prefix}
        </Text>
        <div className="relative flex-1">
          <Input
            value={value ?? ""}
            onChange={handleChange}
            placeholder="ma-page"
            className={clx(
              "font-mono pr-9",
              validation.kind === "error" && "border-ui-border-error"
            )}
          />
          {Icon && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              {Icon}
            </span>
          )}
        </div>
        <Tooltip
          content={
            locked
              ? "Le slug est verrouillé. Clique pour le régénérer depuis le titre."
              : "Le slug se met à jour automatiquement. Clique pour le verrouiller."
          }
        >
          <IconButton
            type="button"
            size="small"
            variant="transparent"
            aria-label={locked ? "Déverrouiller" : "Verrouiller"}
            onClick={() => onLockChange(!locked)}
          >
            {locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4 text-ui-fg-interactive" />
            )}
          </IconButton>
        </Tooltip>
      </div>
      {validation.kind === "error" && (
        <Text size="small" className="text-ui-fg-error">
          {validation.message}
        </Text>
      )}
    </div>
  )
}
