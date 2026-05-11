import { JsonLd } from "@lib/seo/json-ld"
import {
  breadcrumbSchema,
  type BreadcrumbSchemaItem,
} from "@lib/seo/schemas/breadcrumb"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Fragment } from "react"

import { LhArrow } from "./icons"

import type { ReactNode } from "react"

export interface BreadcrumbItem {
  label: string
  /**
   * Path WITHOUT the country segment (e.g. `/produits/jambon-orhi`).
   * LocalizedClientLink prepends `/{countryCode}` for the UI.
   */
  href?: string
}

interface LehenaBreadcrumbProps {
  items: BreadcrumbItem[]
  /**
   * Country/locale segment used to compose absolute URLs in the JSON-LD output.
   * Required when `withJsonLd` is true.
   */
  locale?: string
  separator?: ReactNode
  className?: string
  /** When true, emits a schema.org BreadcrumbList alongside the UI. */
  withJsonLd?: boolean
}

export function LehenaBreadcrumb({
  items,
  locale,
  separator,
  className,
  withJsonLd,
}: LehenaBreadcrumbProps) {
  if (items.length === 0) return null
  const last = items.length - 1

  const schemaItems: BreadcrumbSchemaItem[] | null =
    withJsonLd && locale
      ? items.map((it, idx) => ({
          name: it.label,
          url:
            // Per Google guidance, omit the URL on the last item.
            idx === last
              ? undefined
              : it.href
                ? `/${locale}${it.href.startsWith("/") ? "" : "/"}${it.href}`
                : undefined,
        }))
      : null

  return (
    <>
      {schemaItems ? (
        <JsonLd id="lehena-breadcrumb" schema={breadcrumbSchema(schemaItems)} />
      ) : null}
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
                  <li
                    aria-hidden
                    className="flex items-center text-ink-mute/60"
                  >
                    {separator ?? <LhArrow size={11} />}
                  </li>
                ) : null}
              </Fragment>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
