import { type HttpTypes } from "@medusajs/types"
import { LehenaBreadcrumb } from "@modules/common/components/lehena/breadcrumb"
import RevealInit from "@modules/home/components/lehena/reveal-init"
import LehenaProductActions from "@modules/products/components/lehena-pdp/actions"
import LehenaPDPDeliveryEstimate from "@modules/products/components/lehena-pdp/delivery-estimate"
import LehenaPDPFaq from "@modules/products/components/lehena-pdp/faq"
import LehenaPDPGallery from "@modules/products/components/lehena-pdp/gallery"
import LehenaLeGeste from "@modules/products/components/lehena-pdp/le-geste"
import LehenaPDPNutritional from "@modules/products/components/lehena-pdp/nutritional"
import LehenaPairings from "@modules/products/components/lehena-pdp/pairings"
import LehenaReviews from "@modules/products/components/lehena-pdp/reviews"
import LehenaProductTabs, {
  type Tab,
} from "@modules/products/components/lehena-pdp/tabs"
import LehenaTrustBadges from "@modules/products/components/lehena-pdp/trust-badges"
import WishlistToggle from "@modules/wishlist/wishlist-toggle"
import { Suspense } from "react"

import type { EnrichedProduct } from "@lib/data/product-details"
import type { WishlistItem } from "@lib/data/wishlist"

interface Props {
  product: EnrichedProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  /** Server-resolved wishlist state for this product; null = guest. */
  wishlistItem?: WishlistItem | null
  isGuest: boolean
}

function splitTitle(title: string): { lead: string; tail: string | null } {
  const parts = title.trim().split(/\s+/)
  if (parts.length < 2) return { lead: title, tail: null }
  return {
    lead: parts.slice(0, -1).join(" "),
    tail: parts[parts.length - 1],
  }
}

const CONSERVATION_LABEL: Record<string, string> = {
  ambient: "à température ambiante",
  fresh: "au frais (4 °C)",
  frozen: "au congélateur (−18 °C)",
}

function buildTabs(product: EnrichedProduct): Tab[] {
  const details = product.product_details ?? null
  const description =
    product.description ||
    details?.terroir_story ||
    product.subtitle ||
    "Une pièce d'exception, séchée lentement et naturellement."

  const tabs: Tab[] = [
    {
      id: "description",
      label: "Description",
      content: description,
    },
  ]

  // Origine
  const originLines: string[] = []
  if (details?.breed) originLines.push(`Race : ${details.breed}.`)
  if (details?.origin) originLines.push(`Origine : ${details.origin}.`)
  if (details?.terroir_story && details.terroir_story !== description) {
    originLines.push(details.terroir_story)
  }
  if (originLines.length > 0) {
    tabs.push({
      id: "origine",
      label: "Origine",
      content: originLines.join("\n\n"),
    })
  } else {
    tabs.push({
      id: "origine",
      label: "Origine",
      content:
        "Élevé chez nos partenaires éleveurs du Pays Basque, en agriculture extensive. Traçabilité totale de la naissance à votre table.",
    })
  }

  // Affinage
  const affinageLines: string[] = []
  if (details?.aging_months) {
    affinageLines.push(
      `Affinage : ${details.aging_months} mois minimum dans nos caves de Soule.`
    )
  }
  if (details?.cure_method) {
    affinageLines.push(`Méthode : ${details.cure_method}.`)
  }
  if (details?.nitrite_free) {
    affinageLines.push("Sans nitrite ajouté. Sel sec uniquement.")
  }
  if (affinageLines.length > 0) {
    tabs.push({
      id: "affinage",
      label: "Affinage",
      content: affinageLines.join("\n\n"),
    })
  } else {
    tabs.push({
      id: "affinage",
      label: "Affinage",
      content:
        "Salé au sel sec, posé en cave d'affinage naturel, brassé d'air marin et de mistral pendant plusieurs mois.",
    })
  }

  // Conservation
  const conservationLines: string[] = []
  if (details?.conservation_temp) {
    conservationLines.push(
      `À conserver ${CONSERVATION_LABEL[details.conservation_temp] ?? details.conservation_temp}.`
    )
  }
  if (details?.conservation_days_after_opening) {
    conservationLines.push(
      `Une fois ouvert, à consommer sous ${details.conservation_days_after_opening} jours.`
    )
  }
  if (details?.ddm_days) {
    conservationLines.push(
      `DDM : ${Math.floor(details.ddm_days / 30)} mois minimum à compter de l'expédition.`
    )
  }
  if (conservationLines.length > 0) {
    tabs.push({
      id: "conservation",
      label: "Conservation",
      content: conservationLines.join("\n\n"),
    })
  } else {
    tabs.push({
      id: "conservation",
      label: "Conservation",
      content:
        "À conserver dans un linge propre, au frais. Une fois entamé, recouvrir la coupe et consommer dans les 30 jours.",
    })
  }

  // Ingrédients (uniquement si dispo dans le catalog)
  if (details?.ingredients) {
    tabs.push({
      id: "ingredients",
      label: "Ingrédients",
      content: details.ingredients,
    })
  }

  return tabs
}

export default function LehenaProductTemplate({
  product,
  region,
  countryCode,
  images,
  wishlistItem,
  isGuest,
}: Props) {
  const { lead, tail } = splitTitle(product.title)
  const category = product.categories?.[0]
  const details = product.product_details ?? null
  const tabs = buildTabs(product)

  const badges: string[] = []
  const tagBadges = (product.tags ?? [])
    .map((t) => t.value)
    .filter((v): v is string => !!v)
    .slice(0, 2)
  badges.push(...tagBadges)
  if (details?.nitrite_free) badges.push("Sans nitrite")
  if (details?.aging_months && details.aging_months >= 24)
    badges.push(`${details.aging_months} mois`)
  if (badges.length === 0) badges.push("Maison Lehena")

  return (
    <>
      <RevealInit />
      <div className="lh-wrap" style={{ padding: "24px 0 8px" }}>
        <LehenaBreadcrumb
          items={[
            { label: "Maison", href: "/" },
            { label: "Boutique", href: "/store" },
            ...(category
              ? [
                  {
                    label: category.name,
                    href: `/categories/${category.handle}`,
                  },
                ]
              : []),
            { label: product.title },
          ]}
        />
      </div>

      <section
        style={{ padding: "20px 0 80px" }}
        data-testid="product-container"
      >
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

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <LehenaProductActions product={product} region={region} />
              </div>
              <WishlistToggle
                productId={product.id}
                initiallyIn={!!wishlistItem}
                itemId={wishlistItem?.id ?? null}
                isGuest={isGuest}
                size={22}
                className="lh-pdp-wishlist"
              />
            </div>

            <div style={{ marginTop: 24, marginBottom: 28 }}>
              <LehenaPDPDeliveryEstimate
                conservationTemp={details?.conservation_temp}
              />
            </div>

            <LehenaTrustBadges details={details} />

            <LehenaProductTabs tabs={tabs} />
          </div>
        </div>
      </section>

      <LehenaLeGeste />

      {details ? <LehenaPDPNutritional details={details} /> : null}

      {product.faq_items && product.faq_items.length > 0 ? (
        <LehenaPDPFaq items={product.faq_items} />
      ) : null}

      <Suspense fallback={null}>
        <LehenaPairings product={product} countryCode={countryCode} />
      </Suspense>

      <LehenaReviews />
    </>
  )
}
