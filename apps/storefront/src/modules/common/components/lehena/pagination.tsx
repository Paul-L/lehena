"use client"

import { cn } from "@lib/util/cn"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useMemo } from "react"

import { LhArrow } from "./icons"

interface LehenaPaginationProps {
  /** 1-indexed current page. */
  page: number
  /** Total pages (>= 1). */
  totalPages: number
  /** Query string key used to control the page in the URL. Defaults to `page`. */
  paramKey?: string
  /** Max number of digit buttons rendered (excluding prev/next/ellipsis). */
  maxDigits?: number
  className?: string
}

function buildRange(
  page: number,
  total: number,
  max: number
): (number | "…")[] {
  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const out: (number | "…")[] = []
  const side = Math.floor((max - 3) / 2)
  const start = Math.max(2, page - side)
  const end = Math.min(total - 1, page + side)

  out.push(1)
  if (start > 2) out.push("…")
  for (let i = start; i <= end; i++) out.push(i)
  if (end < total - 1) out.push("…")
  out.push(total)
  return out
}

export function LehenaPagination({
  page,
  totalPages,
  paramKey = "page",
  maxDigits = 7,
  className,
}: LehenaPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const items = useMemo(
    () => buildRange(page, totalPages, maxDigits),
    [page, totalPages, maxDigits]
  )

  if (totalPages <= 1) return null

  const navigate = (target: number) => {
    if (target < 1 || target > totalPages || target === page) return
    const params = new URLSearchParams(searchParams.toString())
    if (target === 1) {
      params.delete(paramKey)
    } else {
      params.set(paramKey, String(target))
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: true })
  }

  const baseBtn =
    "grid place-items-center min-w-9 h-9 px-3 font-mono text-[11px] uppercase tracking-[0.12em] border border-line rounded-circle transition-colors"

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        onClick={() => navigate(page - 1)}
        disabled={page <= 1}
        aria-label="Page précédente"
        className={cn(
          baseBtn,
          "hover:bg-ink hover:text-creme disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <span className="rotate-180 inline-flex">
          <LhArrow size={14} />
        </span>
      </button>
      <ul className="flex items-center gap-1.5">
        {items.map((it, idx) => (
          <li key={`${it}-${idx}`}>
            {it === "…" ? (
              <span
                aria-hidden
                className="grid place-items-center min-w-9 h-9 text-ink-mute"
              >
                …
              </span>
            ) : (
              <button
                type="button"
                onClick={() => navigate(it)}
                aria-current={it === page ? "page" : undefined}
                className={cn(
                  baseBtn,
                  it === page
                    ? "bg-ink text-creme border-ink"
                    : "hover:bg-ink hover:text-creme"
                )}
              >
                {it}
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => navigate(page + 1)}
        disabled={page >= totalPages}
        aria-label="Page suivante"
        className={cn(
          baseBtn,
          "hover:bg-ink hover:text-creme disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <LhArrow size={14} />
      </button>
    </nav>
  )
}
