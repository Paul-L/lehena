import { buildMetadata } from "@lib/seo/metadata"
import LehenaBestSellers from "@modules/home/components/lehena/best-sellers"
import LehenaCoffrets from "@modules/home/components/lehena/coffrets"
import LehenaEditorialBlocks from "@modules/home/components/lehena/editorial-blocks"
import LehenaEngagements from "@modules/home/components/lehena/engagements"
import LehenaHero from "@modules/home/components/lehena/hero"
import LehenaJambonOrhi from "@modules/home/components/lehena/jambon-orhi"
import LehenaLaFerme from "@modules/home/components/lehena/la-ferme"
import LehenaNewsletterHome from "@modules/home/components/lehena/newsletter-home"
import LehenaNotreAtelier from "@modules/home/components/lehena/notre-atelier"
import LehenaPressQuote from "@modules/home/components/lehena/press-quote"
import LehenaReassuranceBar from "@modules/home/components/lehena/reassurance-bar"
import RevealInit from "@modules/home/components/lehena/reveal-init"
import LehenaStory from "@modules/home/components/lehena/story"
import { type Metadata } from "next"

export const metadata: Metadata = buildMetadata({
  // Home: the default title (with the brand) is exactly what we want — no override.
  description:
    "Maître Artisan Charcutier au Pays Basque. Jambons affinés 15 mois minimum, salaisons sans nitrite, patxaran et épicerie fine du Sud-Ouest.",
})

interface HomeProps {
  params: Promise<{ countryCode: string }>
}

export default async function Home({ params }: HomeProps) {
  const { countryCode } = await params

  return (
    <>
      <RevealInit />
      <LehenaHero />
      <LehenaReassuranceBar />
      <LehenaStory />
      <LehenaBestSellers countryCode={countryCode} />
      <LehenaJambonOrhi />
      <LehenaEngagements />
      <LehenaLaFerme />
      <LehenaCoffrets countryCode={countryCode} />
      <LehenaNotreAtelier />
      <LehenaEditorialBlocks />
      <LehenaPressQuote />
      <LehenaNewsletterHome />
    </>
  )
}
