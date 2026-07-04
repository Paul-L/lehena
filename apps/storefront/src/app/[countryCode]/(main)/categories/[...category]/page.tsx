import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { parseFacetsFromSearchParams } from "@lib/data/facets-parser"
import { listFacetedProducts } from "@lib/data/products-faceted"
import { listRegions } from "@lib/data/regions"
import { JsonLd } from "@lib/seo/json-ld"
import { buildMetadata } from "@lib/seo/metadata"
import { breadcrumbSchema } from "@lib/seo/schemas/breadcrumb"
import { getBaseURL } from "@lib/util/env"
import { type StoreRegion, type HttpTypes } from "@medusajs/types"
import LehenaStoreTemplate from "@modules/store/templates/lehena-store-template"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateStaticParams() {
  // Resilient build: if the backend is unreachable/unseeded at build time
  // (self-hosted image build in CI), return [] so no category path is
  // pre-rendered — pages are generated on first request (ISR) instead of
  // hard-failing the Docker image build.
  try {
    const product_categories = await listCategories()

    if (!product_categories) {
      return []
    }

    const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    const categoryHandles = product_categories.map(
      (category) => category.handle as string
    )

    const staticParams = countryCodes
      ?.map((countryCode) =>
        categoryHandles.map((handle: string) => ({
          countryCode,
          category: [handle],
        }))
      )
      .flat()

    return staticParams ?? []
  } catch (error) {
    console.error(
      `Failed to generate static paths for category pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

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
  ]
  return FILTER_KEYS.some((k) => {
    const v = searchParams[k]
    return (
      v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)
    )
  })
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams
  try {
    const productCategory = await getCategoryByHandle(params.category)
    const baseUrl = getBaseURL().replace(/\/$/, "")
    const canonical = `${baseUrl}/${params.countryCode}/categories/${params.category.join("/")}`

    return buildMetadata({
      title: productCategory.name,
      description:
        productCategory.description ??
        `Découvrez notre sélection ${productCategory.name.toLowerCase()} chez Maison Lehena.`,
      canonical,
      // Filtered pages (any query param applied) are noindex per strategie-seo.md
      // so Google indexes the base category, not the filter combinations.
      noindex: hasFilters(searchParams),
    })
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params

  const productCategory = await getCategoryByHandle(params.category)
  if (!productCategory) {
    notFound()
  }

  // Pull the first product page server-side so we can emit an ItemList
  // schema for SEO. The same fetch is deduped against the one inside the
  // template thanks to Next's request cache.
  const { facets } = parseFacetsFromSearchParams(searchParams, {
    countryCode: params.countryCode,
    category_handle: productCategory.handle,
  })
  const { products } = await listFacetedProducts({ ...facets, limit: 10 })

  const baseUrl = getBaseURL().replace(/\/$/, "")
  const breadcrumb = breadcrumbSchema([
    { name: "Maison", url: `/${params.countryCode}` },
    { name: "Boutique", url: `/${params.countryCode}/store` },
    {
      name: productCategory.name,
      // last item: omit URL per Google guidance (handled by breadcrumbSchema).
    },
  ])

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.slice(0, 10).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${baseUrl}/${params.countryCode}/products/${p.handle}`,
      name: p.title,
    })),
  }

  return (
    <>
      <JsonLd id="lehena-breadcrumb" schema={breadcrumb} />
      {products.length > 0 ? (
        <JsonLd id="lehena-itemlist" schema={itemList} />
      ) : null}
      <LehenaStoreTemplate
        searchParams={searchParams}
        countryCode={params.countryCode}
        category={{
          id: productCategory.id,
          name: productCategory.name,
          handle: productCategory.handle,
          description: (productCategory as HttpTypes.StoreProductCategory)
            .description,
        }}
        title={productCategory.name + ","}
        subtitle={
          productCategory.description ||
          `Notre sélection ${productCategory.name.toLowerCase()}, affinée et expédiée depuis le Pays Basque.`
        }
      />
    </>
  )
}
