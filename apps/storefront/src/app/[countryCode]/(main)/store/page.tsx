import { parseFacetsFromSearchParams } from "@lib/data/facets-parser"
import { listFacetedProducts } from "@lib/data/products-faceted"
import { JsonLd } from "@lib/seo/json-ld"
import { buildMetadata } from "@lib/seo/metadata"
import { breadcrumbSchema } from "@lib/seo/schemas/breadcrumb"
import { getBaseURL } from "@lib/util/env"
import LehenaStoreTemplate from "@modules/store/templates/lehena-store-template"
import { type Metadata } from "next"

export const dynamic = "force-dynamic"

const STORE_DESCRIPTION =
  "Toute la maison Lehena, en un seul endroit. Jambons d'Iparralde, salaisons, patxaran et épicerie fine du Pays Basque."

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  params: Promise<{ countryCode: string }>
}

// Any filter/sort/pagination/view param produces a distinct URL with identical
// content: keep the base /store canonical and noindex the variants so Google
// consolidates on the hub page (same strategy as the category route).
function hasFilters(
  searchParams: Record<string, string | string[] | undefined>
): boolean {
  const FILTER_KEYS = [
    "aging",
    "nitrite_free",
    "breed",
    "origin",
    "allergens_excluded",
    "format",
    "page",
    "sort",
    "view",
  ]
  return FILTER_KEYS.some((k) => {
    const v = searchParams[k]
    return (
      v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)
    )
  })
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const searchParams = await props.searchParams
  const baseUrl = getBaseURL().replace(/\/$/, "")

  return buildMetadata({
    title: "Boutique",
    description: STORE_DESCRIPTION,
    canonical: `${baseUrl}/${countryCode}/store`,
    noindex: hasFilters(searchParams),
  })
}

export default async function StorePage({ searchParams, params }: Props) {
  const sp = await searchParams
  const { countryCode } = await params

  // First page of products, server-side, to emit an ItemList schema. Deduped
  // against the template's own fetch via Next's request cache.
  const { facets } = parseFacetsFromSearchParams(sp, { countryCode })
  const { products } = await listFacetedProducts({ ...facets, limit: 10 })

  const baseUrl = getBaseURL().replace(/\/$/, "")
  const breadcrumb = breadcrumbSchema([
    { name: "Maison", url: `/${countryCode}` },
    { name: "Boutique" },
  ])
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.slice(0, 10).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${baseUrl}/${countryCode}/products/${p.handle}`,
      name: p.title,
    })),
  }

  return (
    <>
      <JsonLd id="lehena-breadcrumb" schema={breadcrumb} />
      {products.length > 0 ? (
        <JsonLd id="lehena-itemlist" schema={itemList} />
      ) : null}
      <LehenaStoreTemplate searchParams={sp} countryCode={countryCode} />
    </>
  )
}
