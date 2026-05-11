import { buildMetadata } from "@lib/seo/metadata"
import LehenaStoreTemplate from "@modules/store/templates/lehena-store-template"
import { type Metadata } from "next"

export const metadata: Metadata = buildMetadata({
  title: "Boutique",
  description:
    "Toute la maison Lehena, en un seul endroit. Jambons d'Iparralde, salaisons, patxaran et épicerie fine du Pays Basque.",
})

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  params: Promise<{ countryCode: string }>
}

export default async function StorePage({ searchParams, params }: Props) {
  const sp = await searchParams
  const { countryCode } = await params

  return <LehenaStoreTemplate searchParams={sp} countryCode={countryCode} />
}
