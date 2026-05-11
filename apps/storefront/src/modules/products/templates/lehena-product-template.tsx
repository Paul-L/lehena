import { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RevealInit from "@modules/home/components/lehena/reveal-init"
import LehenaProductActions from "@modules/products/components/lehena-pdp/actions"
import LehenaPDPGallery from "@modules/products/components/lehena-pdp/gallery"
import LehenaLeGeste from "@modules/products/components/lehena-pdp/le-geste"
import LehenaPairings from "@modules/products/components/lehena-pdp/pairings"
import LehenaProductTabs from "@modules/products/components/lehena-pdp/tabs"
import LehenaReviews from "@modules/products/components/lehena-pdp/reviews"
import LehenaTrustBadges from "@modules/products/components/lehena-pdp/trust-badges"

type Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

function splitTitle(title: string): { lead: string; tail: string | null } {
  const parts = title.trim().split(/\s+/)
  if (parts.length < 2) return { lead: title, tail: null }
  return {
    lead: parts.slice(0, -1).join(" "),
    tail: parts[parts.length - 1],
  }
}

const DEFAULT_TABS = [
  {
    id: "origine",
    label: "Origine",
    fallback:
      "Élevé chez nos partenaires éleveurs du Pays Basque intérieur, en agriculture extensive. Traçabilité totale de la naissance à votre table.",
  },
  {
    id: "affinage",
    label: "Affinage",
    fallback:
      "Salé au sel sec, posé en cave d'affinage naturel, brassé d'air marin et de mistral pendant plusieurs mois.",
  },
  {
    id: "conservation",
    label: "Conservation",
    fallback:
      "À conserver dans un linge propre, au frais. Une fois entamé, recouvrir la coupe et consommer dans les 30 jours.",
  },
] as const

export default function LehenaProductTemplate({
  product,
  region,
  countryCode,
  images,
}: Props) {
  const { lead, tail } = splitTitle(product.title)
  const category = product.categories?.[0]
  const meta = (product.metadata ?? {}) as Record<string, unknown>

  const description =
    product.description ||
    (typeof meta.description === "string" ? (meta.description as string) : "")

  const tabs = [
    {
      id: "description",
      label: "Description",
      content: description || "Une pièce d'exception, séchée lentement et naturellement.",
    },
    ...DEFAULT_TABS.map((t) => ({
      id: t.id,
      label: t.label,
      content:
        (typeof meta[t.id] === "string" && (meta[t.id] as string)) || t.fallback,
    })),
  ]

  const badges: string[] = []
  const tagBadges = (product.tags ?? [])
    .map((t) => t.value)
    .filter((v): v is string => !!v)
    .slice(0, 3)
  badges.push(...tagBadges)
  if (badges.length === 0) badges.push("Maison Lehena")

  return (
    <>
      <RevealInit />
      <div className="lh-wrap" style={{ padding: "24px 0 8px" }}>
        <div
          className="eyebrow"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <LocalizedClientLink href="/" style={{ color: "var(--ink-mute)" }}>
            Maison
          </LocalizedClientLink>
          <span style={{ color: "var(--ink-mute)" }}>/</span>
          <LocalizedClientLink href="/store" style={{ color: "var(--ink-mute)" }}>
            Boutique
          </LocalizedClientLink>
          {category && (
            <>
              <span style={{ color: "var(--ink-mute)" }}>/</span>
              <LocalizedClientLink
                href={`/categories/${category.handle}`}
                style={{ color: "var(--ink-mute)" }}
              >
                {category.name}
              </LocalizedClientLink>
            </>
          )}
          <span style={{ color: "var(--ink-mute)" }}>/</span>
          <span>{product.title}</span>
        </div>
      </div>

      <section style={{ padding: "20px 0 80px" }} data-testid="product-container">
        <div
          className="lh-wrap"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 60,
            alignItems: "start",
          }}
        >
          <LehenaPDPGallery
            images={images}
            title={product.title}
            badges={badges}
          />

          <div>
            {category && (
              <div
                className="eyebrow"
                style={{ marginBottom: 14, color: "var(--rouge)" }}
              >
                {category.name}
              </div>
            )}
            <h1
              className="serif-display"
              style={{
                fontSize: "var(--step-5)",
                lineHeight: 1,
                marginBottom: 14,
                letterSpacing: "-0.02em",
              }}
            >
              {tail ? (
                <>
                  {lead}{" "}
                  <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
                    {tail}
                  </em>
                </>
              ) : (
                lead
              )}
            </h1>
            {product.subtitle && (
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 18,
                  color: "var(--ink-soft)",
                  marginBottom: 32,
                  lineHeight: 1.5,
                }}
              >
                {product.subtitle}
              </p>
            )}

            <LehenaProductActions product={product} region={region} />

            <LehenaTrustBadges />

            <LehenaProductTabs tabs={tabs} />
          </div>
        </div>
      </section>

      <LehenaLeGeste />

      <Suspense fallback={null}>
        <LehenaPairings product={product} countryCode={countryCode} />
      </Suspense>

      <LehenaReviews />
    </>
  )
}
