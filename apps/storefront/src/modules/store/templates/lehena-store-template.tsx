import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import LehenaStoreControls, {
  type CategoryOption,
} from "@modules/store/components/lehena-controls"
import { type SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Suspense } from "react"

import LehenaPaginatedProducts from "./lehena-paginated-products"

interface LehenaStoreTemplateProps {
  sortBy?: SortOptions
  page?: string
  view?: "compact" | "comfort" | "spacious"
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

const FILTERS = [
  { id: "sans-nitrite", label: "Sans nitrite" },
  { id: "duroc", label: "Race Duroc" },
  { id: "espelette", label: "Piment d'Espelette" },
  { id: "plat-cuisine", label: "Plat cuisiné" },
]

const PRICE_BANDS = [
  { id: "lt-20", label: "< 20 €" },
  { id: "20-50", label: "20 – 50 €" },
  { id: "50-100", label: "50 – 100 €" },
  { id: "gt-100", label: "> 100 €" },
]

export default async function LehenaStoreTemplate({
  sortBy = "created_at",
  page = "1",
  view = "comfort",
  countryCode,
  category,
  title,
  subtitle,
}: LehenaStoreTemplateProps) {
  const pageNumber = parseInt(page) || 1

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
    "Jambons, salaisons, patxaran et épicerie fine. Sélectionnés, affinés et expédiés depuis Saint-Étienne-de-Baïgorry."

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
        sortBy={sortBy}
        view={view}
      />

      <section style={{ padding: "40px 0 100px" }}>
        <div
          className="lh-wrap"
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          <aside style={{ position: "sticky", top: 160 }}>
            <div className="eyebrow" style={{ marginBottom: 24 }}>
              Affiner
            </div>
            <div style={{ marginBottom: 32 }}>
              <div
                className="serif"
                style={{
                  fontStyle: "italic",
                  fontSize: 18,
                  marginBottom: 14,
                }}
              >
                Filtres
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {FILTERS.map((f) => (
                  <li key={f.id}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ accentColor: "var(--rouge)" }}
                      />
                      <span>{f.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 32 }}>
              <div
                className="serif"
                style={{
                  fontStyle: "italic",
                  fontSize: 18,
                  marginBottom: 14,
                }}
              >
                Prix
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {PRICE_BANDS.map((b) => (
                  <label
                    key={b.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ accentColor: "var(--rouge)" }}
                    />
                    {b.label}
                  </label>
                ))}
              </div>
            </div>

            <div
              style={{
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
            <Suspense fallback={<SkeletonProductGrid />}>
              <LehenaPaginatedProducts
                sortBy={sortBy}
                page={pageNumber}
                view={view}
                categoryId={category?.id}
                countryCode={countryCode}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  )
}
