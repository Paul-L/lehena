import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Bientôt disponible · Maison Lehena",
  description:
    "La version multilingue du site Maison Lehena sera disponible prochainement.",
  robots: { index: false, follow: true },
}

type Lang = "es" | "en"
const isSupported = (v: string | undefined): v is Lang =>
  v === "es" || v === "en"

interface Copy {
  eyebrow: string
  title: string
  body: string
  cta: string
}

const COPY: Record<Lang | "default", Copy> = {
  es: {
    eyebrow: "Próximamente",
    title: "Estamos preparando la versión española.",
    body: "La Maison Lehena estará disponible en español muy pronto. Mientras tanto, te invitamos a descubrir nuestra charcutería del País Vasco en francés.",
    cta: "Volver al sitio en francés",
  },
  en: {
    eyebrow: "Coming soon",
    title: "We're preparing the English version.",
    body: "Maison Lehena will soon be available in English. In the meantime, we invite you to explore our Basque artisan charcuterie in French.",
    cta: "Back to the French site",
  },
  default: {
    eyebrow: "À venir",
    title: "Cette page n'est pas encore disponible.",
    body: "Le site Maison Lehena n'est pour l'instant disponible qu'en français. Les versions espagnole et anglaise arrivent bientôt.",
    cta: "Retour à l'accueil",
  },
}

interface PageProps {
  searchParams: Promise<{ lang?: string }>
}

export default async function ComingSoonPage({ searchParams }: PageProps) {
  const { lang } = await searchParams
  const key = isSupported(lang) ? lang : "default"
  const c = COPY[key]

  return (
    <section className="min-h-[60vh] grid place-items-center px-[var(--gutter,32px)] py-24">
      <div className="max-w-2xl text-center flex flex-col items-center gap-6">
        <span className="eyebrow text-rouge">{c.eyebrow}</span>
        <h1 className="font-display text-step-5 text-ink leading-[1.1]">
          {c.title}
        </h1>
        <p className="font-serif text-step-1 text-ink-soft italic max-w-prose">
          {c.body}
        </p>
        <div className="mt-4">
          <LocalizedClientLink
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 font-sans text-[13px] uppercase tracking-[0.12em] font-medium rounded-circle bg-ink text-creme border border-ink hover:bg-rouge hover:border-rouge transition-colors"
          >
            {c.cta}
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}
