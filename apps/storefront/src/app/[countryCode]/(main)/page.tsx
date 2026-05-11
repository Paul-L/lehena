import LehenaEditorialBlocks from "@modules/home/components/lehena/editorial-blocks"
import LehenaHero from "@modules/home/components/lehena/hero"
import LehenaJambonOrhi from "@modules/home/components/lehena/jambon-orhi"
import LehenaLaFerme from "@modules/home/components/lehena/la-ferme"
import LehenaPressQuote from "@modules/home/components/lehena/press-quote"
import RevealInit from "@modules/home/components/lehena/reveal-init"
import LehenaSelection from "@modules/home/components/lehena/selection"
import LehenaStory from "@modules/home/components/lehena/story"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Maison Lehena · Maître artisan charcutier au Pays Basque",
  description:
    "Maître Artisan Charcutier au Pays Basque depuis 1974. Jambons affinés 24 mois, salaisons sans nitrite, patxaran et épicerie fine du Sud-Ouest.",
}

export default function Home() {
  return (
    <>
      <RevealInit />
      <LehenaHero />
      <LehenaStory />
      <LehenaSelection />
      <LehenaJambonOrhi />
      <LehenaLaFerme />
      <LehenaEditorialBlocks />
      <LehenaPressQuote />
    </>
  )
}
