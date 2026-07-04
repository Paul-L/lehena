import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { buildMetadata } from "@lib/seo/metadata"
import { type StoreCollection, type StoreRegion } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { type SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  // Resilient build: if the backend is unreachable/unseeded at build time
  // (self-hosted image build in CI), return [] so no collection path is
  // pre-rendered — pages are generated on first request (ISR) instead of
  // hard-failing the Docker image build.
  try {
    const { collections } = await listCollections({
      fields: "*products",
    })

    if (!collections) {
      return []
    }

    const countryCodes = await listRegions().then(
      (regions: StoreRegion[]) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    const collectionHandles = collections.map(
      (collection: StoreCollection) => collection.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string) =>
        collectionHandles.map((handle: string | undefined) => ({
          countryCode,
          handle,
        }))
      )
      .flat()

    return staticParams ?? []
  } catch (error) {
    console.error(
      `Failed to generate static paths for collection pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  // Paginated/sorted variants are noindex to avoid duplicate-content crawl.
  const isFiltered = Boolean(searchParams?.page || searchParams?.sortBy)

  return buildMetadata({
    title: collection.title,
    description: `Découvrez la sélection « ${collection.title} » de la Maison Lehena — charcuterie artisanale du Pays Basque.`,
    noindex: isFiltered,
  })
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}
