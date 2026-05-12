import { retrieveCustomer } from "@lib/data/customer"
import { getProductDetails } from "@lib/data/product-details"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { listWishlist } from "@lib/data/wishlist"
import { JsonLd } from "@lib/seo/json-ld"
import { buildMetadata } from "@lib/seo/metadata"
import { breadcrumbSchema } from "@lib/seo/schemas/breadcrumb"
import { faqPageSchema } from "@lib/seo/schemas/faq"
import { productSchema } from "@lib/seo/schemas/product"
import { getBaseURL } from "@lib/util/env"
import { type HttpTypes } from "@medusajs/types"
import LehenaProductTemplate from "@modules/products/templates/lehena-product-template"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v?: string; v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) return []

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })
      return { country, products: response.products }
    })

    const countryProducts = await Promise.all(promises)
    return countryProducts
      .flatMap((cd) =>
        cd.products.map((p) => ({
          countryCode: cd.country,
          handle: p.handle,
        }))
      )
      .filter((p) => p.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) return product.images
  const variant = product.variants.find((v) => v.id === selectedVariantId)
  const variantImages = variant?.images ?? []
  if (!variant || variantImages.length === 0) return product.images
  const ids = new Set(variantImages.map((i) => i.id))
  return product.images?.filter((i) => ids.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const product = await getProductDetails(params.handle, params.countryCode)
  if (!product) notFound()

  const details = product.product_details ?? null
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const canonical = `${baseUrl}/${params.countryCode}/products/${product.handle}`

  return buildMetadata({
    title: details?.seo_title ?? product.title,
    description:
      details?.seo_description ??
      product.subtitle ??
      product.description ??
      undefined,
    ogImage: details?.og_image_url ?? product.thumbnail ?? undefined,
    canonical,
    ogType: "article",
    noindex: details?.noindex ?? false,
  })
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  // Accept both ?v= (new convention) and the legacy ?v_id=
  const selectedVariantId = searchParams.v ?? searchParams.v_id

  const region = await getRegion(params.countryCode)
  if (!region) notFound()

  const product = await getProductDetails(params.handle, params.countryCode)
  if (!product) notFound()

  const images = getImagesForVariant(product, selectedVariantId) ?? []
  const category = product.categories?.[0]

  // Resolve wishlist state server-side so the heart renders in its correct
  // state on first paint (no flicker between guest false and customer true).
  const customer = await retrieveCustomer().catch(() => null)
  const wishlistItem =
    customer && product.id
      ? ((await listWishlist()).find((it) => it.product_id === product.id) ??
        null)
      : null

  return (
    <>
      <JsonLd
        id="lehena-product"
        schema={productSchema({
          product,
          countryCode: params.countryCode,
          // Mock until reviews land in Phase 10.
          aggregateRating: { ratingValue: 4.8, reviewCount: 247 },
        })}
      />
      <JsonLd
        id="lehena-pdp-breadcrumb"
        schema={breadcrumbSchema([
          { name: "Maison", url: `/${params.countryCode}` },
          { name: "Boutique", url: `/${params.countryCode}/store` },
          ...(category
            ? [
                {
                  name: category.name,
                  url: `/${params.countryCode}/categories/${category.handle}`,
                },
              ]
            : []),
          { name: product.title },
        ])}
      />
      {product.faq_items && product.faq_items.length > 0 ? (
        <JsonLd
          id="lehena-pdp-faq"
          schema={faqPageSchema(
            product.faq_items.map((it) => ({
              question: it.question,
              answer: it.answer,
            }))
          )}
        />
      ) : null}
      <LehenaProductTemplate
        product={product}
        region={region}
        countryCode={params.countryCode}
        images={images}
        wishlistItem={wishlistItem}
        isGuest={!customer}
      />
    </>
  )
}
