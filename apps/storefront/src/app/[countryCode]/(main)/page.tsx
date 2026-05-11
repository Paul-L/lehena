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

export const metadata: Metadata = {
  title: "Maison Lehena · Maître artisan charcutier au Pays Basque",
  description:
    "Maître Artisan Charcutier au Pays Basque depuis 1974. Jambons affinés 24 mois, salaisons sans nitrite, patxaran et épicerie fine du Sud-Ouest.",
}

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
