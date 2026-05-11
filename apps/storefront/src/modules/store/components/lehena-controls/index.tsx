"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"

import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export interface CategoryOption {
  slug: string | null
  label: string
}

interface Props {
  categories: CategoryOption[]
  activeCategory?: string
  sortBy: SortOptions
  view: "compact" | "comfort" | "spacious"
}

const VIEW_OPTIONS: { id: "compact" | "comfort" | "spacious"; cols: number }[] =
  [
    { id: "compact", cols: 4 },
    { id: "comfort", cols: 3 },
    { id: "spacious", cols: 2 },
  ]

const SORT_OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Recommandés" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
]

export default function LehenaStoreControls({
  categories,
  activeCategory,
  sortBy,
  view,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === "") params.delete(key)
      else params.set(key, value)
      const qs = params.toString()
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      })
    },
    [pathname, router, searchParams]
  )

  return (
    <section
      style={{
        position: "sticky",
        top: 73,
        zIndex: 20,
        background: "var(--bg)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        className="lh-wrap"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            overflowX: "auto",
          }}
        >
          {categories.map((c) => {
            const isActive = c.slug
              ? activeCategory === c.slug
              : !activeCategory
            return (
              <LocalizedClientLink
                key={c.slug ?? "all"}
                href={c.slug ? `/categories/${c.slug}` : "/store"}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: isActive ? "var(--ink)" : "transparent",
                  color: isActive ? "var(--bg)" : "var(--ink)",
                  border: "1px solid",
                  borderColor: isActive ? "var(--ink)" : "var(--line-strong)",
                  whiteSpace: "nowrap",
                  transition: "all 200ms ease",
                  display: "inline-block",
                }}
                data-testid={`category-tab-${c.slug ?? "all"}`}
                aria-current={isActive ? "page" : undefined}
              >
                {c.label}
              </LocalizedClientLink>
            )
          })}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <select
            value={sortBy}
            onChange={(e) => setParam("sortBy", e.target.value)}
            disabled={isPending}
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "8px 14px",
              border: "1px solid var(--line-strong)",
              borderRadius: 999,
              background: "var(--bg)",
              color: "var(--ink)",
              cursor: "pointer",
            }}
            data-testid="sort-by-select"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div
            style={{
              display: "flex",
              border: "1px solid var(--line-strong)",
              borderRadius: 999,
              overflow: "hidden",
            }}
            role="group"
            aria-label="Densité d'affichage"
          >
            {VIEW_OPTIONS.map((v, i) => {
              const isActive = view === v.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() =>
                    setParam("view", v.id === "comfort" ? null : v.id)
                  }
                  title={v.id}
                  disabled={isPending}
                  style={{
                    padding: "8px 12px",
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    background: isActive ? "var(--ink)" : "transparent",
                    color: isActive ? "var(--bg)" : "var(--ink)",
                    borderLeft: i > 0 ? "1px solid var(--line-strong)" : "none",
                  }}
                >
                  {v.cols} ✕
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
