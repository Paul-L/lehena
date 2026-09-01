import { getAuthorBySlug } from "@lib/data/authors"
import { localeForCountry } from "@lib/i18n/locale-map"
import { JsonLd } from "@lib/seo/json-ld"
import { buildMetadata } from "@lib/seo/metadata"
import { breadcrumbSchema } from "@lib/seo/schemas/breadcrumb"
import { personSchema } from "@lib/seo/schemas/person"
import { getBaseURL } from "@lib/util/env"
import Link from "next/link"
import { notFound } from "next/navigation"

import type { Metadata } from "next"

interface Params {
  countryCode: string
  slug: string
}

interface Props {
  params: Promise<Params>
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug } = await props.params
  const locale = localeForCountry(countryCode)
  const result = await getAuthorBySlug(slug, { locale })

  if (!result) {
    return buildMetadata({ title: "Auteur introuvable", noindex: true })
  }

  const { author } = result
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const roleSuffix = author.role_title ? ` — ${author.role_title}` : ""

  return buildMetadata({
    title: `${author.name}${roleSuffix}`,
    description:
      author.bio ??
      `Découvrez ${author.name}, contributeur de la Maison Lehena.`,
    canonical: `${baseUrl}/${countryCode}/auteurs/${author.slug}`,
    ogType: "article",
    ogImage: author.photo_url ?? undefined,
  })
}

export default async function AuthorPage(props: Props) {
  const { countryCode, slug } = await props.params
  const locale = localeForCountry(countryCode)
  const result = await getAuthorBySlug(slug, { locale })

  if (!result) {
    notFound()
  }

  const { author, articles } = result
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const authorUrl = `${baseUrl}/${countryCode}/auteurs/${author.slug}`
  const sameAs = author.social_links?.map((s) => s.url) ?? []

  return (
    <>
      <JsonLd
        id="author-breadcrumb"
        schema={breadcrumbSchema([
          { name: "Accueil", url: `/${countryCode}` },
          { name: author.name },
        ])}
      />
      {/*
        @id ties this Person node to the `author` referenced from each
        article's BlogPosting schema (`${authorUrl}#person`), so Google can
        merge the byline and the profile into one entity for EEAT.
      */}
      <JsonLd
        id="author-person"
        schema={{
          ...personSchema({
            name: author.name,
            url: authorUrl,
            image: author.photo_url,
            description: author.bio,
            jobTitle: author.role_title,
            sameAs,
          }),
          "@id": `${authorUrl}#person`,
        }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-10 flex flex-col items-start gap-5 border-b border-gray-200 pb-8 sm:flex-row sm:items-center">
          {author.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.photo_url}
              alt={author.name}
              width={112}
              height={112}
              className="h-28 w-28 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gray-200 text-2xl font-semibold text-gray-700"
            >
              {initials(author.name)}
            </span>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {author.name}
            </h1>
            {author.role_title ? (
              <p className="mt-1 text-lg text-ink-mute">{author.role_title}</p>
            ) : null}
            {sameAs.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-4 text-sm">
                {author.social_links?.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      rel="me noopener noreferrer"
                      target="_blank"
                      className="text-gray-900 underline"
                    >
                      {s.platform}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </header>

        {author.bio ? (
          <div className="prose max-w-none">
            <p className="whitespace-pre-line text-lg leading-relaxed text-gray-800">
              {author.bio}
            </p>
          </div>
        ) : null}

        {author.credentials && author.credentials.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-mute">
              Distinctions & expertise
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-800">
              {author.credentials.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900">Publications</h2>
          {articles.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/${countryCode}/${a.slug}`}
                    className="text-lg font-medium text-gray-900 underline"
                  >
                    {a.title}
                  </Link>
                  {a.excerpt ? (
                    <p className="mt-1 text-sm text-ink-mute">{a.excerpt}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            // ⚠️ SEO: an author page with zero published articles is ignored
            // by Google for EEAT purposes. Publish at least one article
            // authored by this person before relying on the profile.
            <p className="mt-4 text-ink-mute">
              Aucune publication pour le moment.
            </p>
          )}
        </section>
      </article>
    </>
  )
}
