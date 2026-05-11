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

  const heading = title ?? "Toute la maison,"
  const headingItalic = "en un seul endroit."
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
              style={{ fontSize: "var(--step-6)", lineHeight: 0.95 }}
              data-testid="store-page-title"
            >
              {heading}
              <br />
              <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
                {headingItalic}
              </em>
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
        categories={categoryOptions}
        activeCategory={category?.handle}
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

            <div
              style={{
                marginTop: 32,
                padding: 20,
                background: "var(--bg-elevated)",
                border: "1px solid var(--line)",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Conseil
              </div>
              <p
                style={{
                  fontSize: 13,
                  fontFamily: "var(--serif)",
                  color: "var(--ink-soft)",
                  lineHeight: 1.5,
                }}
              >
                Vous hésitez ? Notre équipe vous guide pour trouver la pièce qui
                vous correspond.
              </p>
              <a
                href="mailto:contact@lehena.fr"
                style={{
                  marginTop: 12,
                  display: "inline-block",
                  fontSize: 12,
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--rouge)",
                  textDecoration: "underline",
                }}
              >
                Nous contacter
              </a>
            </div>
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
