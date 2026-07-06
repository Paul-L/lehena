"use client"

import {
  AGING_BUCKETS,
  ALLERGEN_OPTIONS,
  BREED_OPTIONS,
  FORMAT_OPTIONS,
} from "@lib/data/facet-constants"
import { LhArrow } from "@modules/common/components/lehena/icons"
import * as Accordion from "@radix-ui/react-accordion"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useTransition } from "react"

interface LehenaFacetFiltersProps {
  /** Current applied filters parsed from the URL (for SSR-friendly hydration). */
  applied: {
    aging_bucket?: string | null
    nitrite_free?: boolean
    breed?: string[]
    origin?: string[]
    allergens_excluded?: string[]
    format?: string[]
  }
}

/**
 * Sidebar facet filters wired to URL search params. Server component above
 * re-renders the product grid whenever a checkbox flips.
 */
export function LehenaFacetFilters({ applied }: LehenaFacetFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const activeCount = useMemo(() => {
    let n = 0
    if (applied.aging_bucket) n++
    if (applied.nitrite_free) n++
    n += applied.breed?.length ?? 0
    n += applied.origin?.length ?? 0
    n += applied.allergens_excluded?.length ?? 0
    n += applied.format?.length ?? 0
    return n
  }, [applied])

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    // Reset to page 1 whenever a filter changes.
    params.delete("page")
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  const toggleInList = (key: string, value: string, current: string[]) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    update(key, next.length === 0 ? null : next.join(","))
  }

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    for (const k of [
      "aging",
      "nitrite_free",
      "breed",
      "origin",
      "allergens_excluded",
      "format",
      "page",
    ]) {
      params.delete(k)
    }
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  return (
    <div className="font-sans text-step-0">
      <div className="flex items-baseline justify-between mb-6">
        <div className="eyebrow">Affiner</div>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-rouge hover:text-rouge-deep transition-colors"
          >
            Tout effacer ({activeCount})
          </button>
        ) : null}
      </div>

      <Accordion.Root
        type="multiple"
        defaultValue={["format", "aging", "options", "breed"]}
        className="flex flex-col gap-1"
      >
        {/* Format */}
        <FacetGroup id="format" title="Format">
          <CheckboxList
            options={FORMAT_OPTIONS.slice(0, 7)}
            applied={applied.format ?? []}
            onToggle={(value, current) =>
              toggleInList("format", value, current)
            }
          />
        </FacetGroup>

        {/* Affinage */}
        <FacetGroup id="aging" title="Affinage">
          <ul className="flex flex-col gap-2.5">
            {AGING_BUCKETS.map((b) => (
              <li key={b.id}>
                <label className="flex items-center gap-2.5 cursor-pointer text-step-0">
                  <input
                    type="radio"
                    name="aging"
                    checked={applied.aging_bucket === b.id}
                    onChange={() => update("aging", b.id)}
                    style={{ accentColor: "var(--rouge)" }}
                  />
                  <span>{b.label}</span>
                </label>
              </li>
            ))}
            {applied.aging_bucket ? (
              <li>
                <button
                  type="button"
                  onClick={() => update("aging", null)}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute hover:text-ink"
                >
                  Réinitialiser l'affinage
                </button>
              </li>
            ) : null}
          </ul>
        </FacetGroup>

        {/* Options (nitrite-free flag) */}
        <FacetGroup id="options" title="Engagements">
          <label className="flex items-center gap-2.5 cursor-pointer text-step-0">
            <input
              type="checkbox"
              checked={applied.nitrite_free === true}
              onChange={(e) =>
                update("nitrite_free", e.target.checked ? "true" : null)
              }
              style={{ accentColor: "var(--rouge)" }}
            />
            Sans nitrite
          </label>
        </FacetGroup>

        {/* Race */}
        <FacetGroup id="breed" title="Race">
          <CheckboxList
            options={BREED_OPTIONS}
            applied={applied.breed ?? []}
            onToggle={(value, current) => toggleInList("breed", value, current)}
          />
        </FacetGroup>

        {/* Allergènes à exclure */}
        <FacetGroup id="allergens" title="Exclure les allergènes">
          <CheckboxList
            options={ALLERGEN_OPTIONS}
            applied={applied.allergens_excluded ?? []}
            onToggle={(value, current) =>
              toggleInList("allergens_excluded", value, current)
            }
          />
        </FacetGroup>
      </Accordion.Root>
    </div>
  )
}

function FacetGroup({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Accordion.Item value={id} className="border-b border-line py-4">
      <Accordion.Header>
        <Accordion.Trigger className="group flex w-full items-center justify-between font-display text-step-1 text-ink py-1 hover:text-rouge transition-colors">
          {title}
          <span
            aria-hidden
            className="rotate-90 group-data-[state=open]:-rotate-90 transition-transform"
          >
            <LhArrow size={14} />
          </span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-open data-[state=closed]:animate-accordion-close">
        <div className="pt-3">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

function CheckboxList({
  options,
  applied,
  onToggle,
}: {
  options: readonly { value: string; label: string }[]
  applied: string[]
  onToggle: (value: string, current: string[]) => void
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {options.map((o) => (
        <li key={o.value}>
          <label className="flex items-center gap-2.5 cursor-pointer text-step-0">
            <input
              type="checkbox"
              checked={applied.includes(o.value)}
              onChange={() => onToggle(o.value, applied)}
              style={{ accentColor: "var(--rouge)" }}
            />
            <span>{o.label}</span>
          </label>
        </li>
      ))}
    </ul>
  )
}
