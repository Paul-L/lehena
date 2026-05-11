import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Fragment } from "react"

import { LhArrow } from "./icons"

import type { ReactNode } from "react"

export interface BreadcrumbItem {
  label: string
  /** Absolute URL path (e.g. `/produits/jambon-orhi`). The country segment is added by LocalizedClientLink. */
  href?: string
}

interface LehenaBreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
  className?: string
}

export function LehenaBreadcrumb({
  items,
  separator,
  className,
}: LehenaBreadcrumbProps) {
  if (items.length === 0) return null
  const last = items.length - 1

  return (
    <nav aria-label="Fil d'Ariane" className={className}>
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute">
        {items.map((item, idx) => {
          const isLast = idx === last
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <LocalizedClientLink
                    href={item.href}
                    className="hover:text-ink transition-colors"
                  >
                    {item.label}
                  </LocalizedClientLink>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "text-ink" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast ? (
                <li aria-hidden className="flex items-center text-ink-mute/60">
                  {separator ?? <LhArrow size={11} />}
                </li>
              ) : null}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
