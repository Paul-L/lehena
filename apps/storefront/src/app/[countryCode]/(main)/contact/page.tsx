import { getLiveProductsByHandle } from "@lib/data/live-products-by-handle"
import { getPageBySlug } from "@lib/data/pages"
import {
  localeForCountry,
  hreflangForLocale,
  type Locale,
} from "@lib/i18n/locale-map"
import {
  extractProductEmbedHandles,
  TiptapContent,
  type JSONContent,
} from "@lib/tiptap-renderer"
import { getBaseURL } from "@lib/util/env"
import ContactForm from "@modules/contact/contact-form"

import type { Metadata } from "next"

interface Params {
  countryCode: string
}

interface Props {
  params: Promise<Params>
}

export const revalidate = 3600

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const locale = localeForCountry(countryCode)
  const result = await getPageBySlug("contact", { locale })
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const canonical = `${baseUrl}/${countryCode}/contact`

  if (!result) {
    return {
      title: "Nous contacter — Lehena",
      alternates: { canonical },
    }
  }

  const { page } = result
  const title = page.meta_title ?? page.title
  const description = page.meta_description ?? page.excerpt ?? undefined

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        [hreflangForLocale(page.locale as Locale)]: canonical,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  }
}

export default async function ContactPage(props: Props) {
  const { countryCode } = await props.params
  const locale = localeForCountry(countryCode)
  const result = await getPageBySlug("contact", { locale })

  // The editorial part is optional — if the CMS entry is missing we still
  // render a usable contact form so the page never 404s.
  const page = result?.page ?? null

  const embedHandles = page
    ? extractProductEmbedHandles(page.content as JSONContent | null)
    : []
  const liveProducts =
    embedHandles.length > 0
      ? await getLiveProductsByHandle(embedHandles, countryCode)
      : undefined

  return (
    <article
      className="lh-wrap"
      style={{ padding: "clamp(48px, 8vw, 96px) 0" }}
    >
      <header style={{ marginBottom: 48 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Contact
        </div>
        <h1
          className="serif-display"
          style={{
            fontSize: "var(--step-5, clamp(40px, 6vw, 64px))",
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          {page?.title ?? "Nous écrire."}
        </h1>
        {page?.excerpt ? (
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 18,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            {page.excerpt}
          </p>
        ) : null}
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 56,
          alignItems: "start",
        }}
      >
        <div>
          {page ? (
            <TiptapContent
              content={page.content as JSONContent | null}
              liveProducts={liveProducts}
              countryCode={countryCode}
            />
          ) : null}
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Le formulaire
          </div>
          <ContactForm locale={locale} sourceSlug="contact" />
        </div>
      </div>
    </article>
  )
}
