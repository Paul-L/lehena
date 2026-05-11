import { Metadata } from "next"

import LehenaStoreTemplate from "@modules/store/templates/lehena-store-template"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const metadata: Metadata = {
  title: "Boutique · Maison Lehena",
  description:
    "Toute la maison Lehena, en un seul endroit. Jambons d'Iparralde, salaisons, patxaran et épicerie fine du Pays Basque.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    view?: "compact" | "comfort" | "spacious"
  }>
  params: Promise<{ countryCode: string }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, view } = searchParams

  return (
    <LehenaStoreTemplate
      sortBy={sortBy}
      page={page}
      view={view}
      countryCode={params.countryCode}
    />
  )
}
