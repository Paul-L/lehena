import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { type StoreRegion } from "@medusajs/types"
import { type SortOptions } from "@modules/store/components/refinement-list/sort-products"
import LehenaStoreTemplate from "@modules/store/templates/lehena-store-template"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    view?: "compact" | "comfort" | "spacious"
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = `${productCategory.name} · Maison Lehena`
    const description =
      productCategory.description ??
      `Découvrez notre sélection ${productCategory.name.toLowerCase()} chez Maison Lehena.`

    return {
      title,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, view } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  return (
    <LehenaStoreTemplate
      sortBy={sortBy}
      page={page}
      view={view}
      countryCode={params.countryCode}
      category={{
        id: productCategory.id,
        name: productCategory.name,
        handle: productCategory.handle,
        description: productCategory.description,
      }}
      title={productCategory.name + ","}
      subtitle={
        productCategory.description ||
        `Notre sélection ${productCategory.name.toLowerCase()}, affinée et expédiée depuis le Pays Basque.`
      }
    />
  )
}
