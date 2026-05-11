import { Metadata } from "next"

import LehenaHero from "@modules/home/components/lehena/hero"
import LehenaStory from "@modules/home/components/lehena/story"
import LehenaSelection from "@modules/home/components/lehena/selection"
import LehenaJambonOrhi from "@modules/home/components/lehena/jambon-orhi"
import LehenaLaFerme from "@modules/home/components/lehena/la-ferme"
import LehenaEditorialBlocks from "@modules/home/components/lehena/editorial-blocks"
import LehenaPressQuote from "@modules/home/components/lehena/press-quote"
import RevealInit from "@modules/home/components/lehena/reveal-init"

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
