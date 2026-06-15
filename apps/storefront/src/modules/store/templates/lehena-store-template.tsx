import { listCategories } from "@lib/data/categories"
import { parseFacetsFromSearchParams } from "@lib/data/facets-parser"
import { LehenaSkeleton } from "@modules/common/components/lehena/skeleton"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LehenaStoreControls, {
  type CategoryOption,
} from "@modules/store/components/lehena-controls"
import { LehenaFacetFilters } from "@modules/store/components/lehena-facet-filters"
import { Suspense } from "react"

import LehenaFacetedProducts from "./lehena-faceted-products"

interface LehenaStoreTemplateProps {
  /** Raw URL search params (await searchParams in the page first). */
  searchParams: Record<string, string | string[] | undefined>
  countryCode: string
  category?: {
    id: string
    name: string
    handle: string
    description?: string | null
  }
  title?: string
  subtitle?: string
}

export default async function LehenaStoreTemplate({
  searchParams,
  countryCode,
  category,
  title,
  subtitle,
}: LehenaStoreTemplateProps) {
  const view: "compact" | "comfort" | "spacious" =
    typeof searchParams.view === "string" &&
    ["compact", "comfort", "spacious"].includes(searchParams.view)
      ? (searchParams.view as "compact" | "comfort" | "spacious")
      : "comfort"

  const { facets, agingBucketId } = parseFacetsFromSearchParams(searchParams, {
    countryCode,
    category_handle: category?.handle,
  })

  const allCategories = await listCategories({ limit: 100 }).catch(() => [])
  const topLevel = allCategories.filter((c) => !c.parent_category_id)
  const categoryOptions: CategoryOption[] = [
    { slug: null, label: "Tout" },
    ...topLevel.map((c) => ({ slug: c.handle, label: c.name })),
  ]

  const heading = title ?? category?.name ?? "Boutique"
  const description =
    subtitle ??
    "Jambons, salaisons, patxaran et épicerie fine. Sélectionnés, affinés et expédiés depuis le Pays Basque."

  return (
    <>
      <section
        style={{
          padding: "60px 0 40px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="lh-wrap">
          <div
            className="eyebrow"
            style={{ marginBottom: 16, display: "flex", gap: 8 }}
          >
            <LocalizedClientLink href="/" style={{ color: "var(--ink-mute)" }}>
              Maison
            </LocalizedClientLink>
            <span style={{ color: "var(--ink-mute)" }}>/</span>
            {category ? (
              <>
                <LocalizedClientLink
                  href="/store"
                  style={{ color: "var(--ink-mute)" }}
                >
                  Boutique
                </LocalizedClientLink>
                <span style={{ color: "var(--ink-mute)" }}>/</span>
                <span>{category.name}</span>
              </>
            ) : (
              <span>Boutique</span>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 60,
              alignItems: "end",
            }}
          >
            <h1
              className="serif-display"
              style={{
                fontSize: "clamp(40px, 5.2vw, 64px)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
              data-testid="store-page-title"
            >
              {heading}
              <span style={{ color: "var(--rouge)" }}>.</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 17,
                color: "var(--ink-soft)",
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          </div>
        </div>
      </section>

      <LehenaStoreControls
        sortBy={facets.sort ?? "created_at"}
        view={view}
      />

      <section style={{ padding: "40px 0 100px" }}>
        <div
          className="lh-wrap"
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          <aside style={{ position: "sticky", top: 160 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Catégories
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 32px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {categoryOptions.map((c) => {
                const isActive = c.slug
                  ? category?.handle === c.slug
                  : !category
                return (
                  <li key={c.slug ?? "all"}>
                    <LocalizedClientLink
                      href={c.slug ? `/categories/${c.slug}` : "/store"}
                      style={{
                        display: "block",
                        padding: "4px 0",
                        fontSize: 14,
                        fontFamily: "var(--serif)",
                        color: isActive ? "var(--ink)" : "var(--ink-soft)",
                        fontWeight: isActive ? 500 : 400,
                        fontStyle: isActive ? "italic" : "normal",
                      }}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {c.label}
                    </LocalizedClientLink>
                  </li>
                )
              })}
            </ul>

            <LehenaFacetFilters
              applied={{
                aging_bucket: agingBucketId,
                nitrite_free: facets.nitrite_free,
                breed: facets.breed,
                origin: facets.origin,
                allergens_excluded: facets.allergens_excluded,
                format: facets.format,
              }}
            />
          </aside>

          <div>
            <Suspense fallback={<FacetedGridSkeleton />}>
              <LehenaFacetedProducts facets={facets} view={view} />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  )
}

function FacetedGridSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 32,
        rowGap: 56,
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <LehenaSkeleton
            tone={i % 2 === 0 ? "kraft" : "argile"}
            style={{ aspectRatio: "4 / 5" }}
          />
          <LehenaSkeleton tone="paper" height={14} width="60%" />
          <LehenaSkeleton tone="paper" height={22} width="80%" />
          <LehenaSkeleton tone="paper" height={14} width="40%" />
        </div>
      ))}
    </div>
  )
}
