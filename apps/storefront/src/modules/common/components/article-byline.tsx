import Link from "next/link"

interface ArticleBylineProps {
  /** Author display name. */
  name: string
  /** Author slug — links to `/[countryCode]/auteurs/[slug]`. */
  slug: string
  /** Country code for the localized author link. */
  countryCode: string
  /** Professional title, e.g. "Maître Artisan Charcutier". */
  roleTitle?: string | null
  /** Portrait URL. Falls back to initials when absent. */
  photoUrl?: string | null
  /** ISO publish date. */
  publishedAt?: string | null
  /** ISO last-modified date. Shown only when it differs from publishedAt. */
  updatedAt?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

/** Same calendar day? Used to suppress a redundant "Mis à jour le". */
function sameDay(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Visible author byline rendered under the H1 of editorial pages.
 * "Par [nom] · [rôle] · Publié le X · Mis à jour le Y" with a portrait
 * (or initials fallback) linking to the author's profile page — the EEAT
 * signal Google looks for on YMYL content (cf. SEO 07).
 */
export default function ArticleByline({
  name,
  slug,
  countryCode,
  roleTitle,
  photoUrl,
  publishedAt,
  updatedAt,
}: ArticleBylineProps) {
  const authorHref = `/${countryCode}/auteurs/${slug}`
  const showUpdated =
    !!updatedAt && !!publishedAt && !sameDay(updatedAt, publishedAt)

  return (
    <div className="mt-4 flex items-center gap-3 text-sm text-ink-mute">
      <Link
        href={authorHref}
        aria-label={`Voir le profil de ${name}`}
        className="shrink-0"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700"
          >
            {initials(name)}
          </span>
        )}
      </Link>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span>
          Par{" "}
          <Link
            href={authorHref}
            className="font-medium text-gray-900 underline"
          >
            {name}
          </Link>
        </span>
        {roleTitle ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{roleTitle}</span>
          </>
        ) : null}
        {publishedAt ? (
          <>
            <span aria-hidden="true">·</span>
            <span>
              Publié le{" "}
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            </span>
          </>
        ) : null}
        {showUpdated && updatedAt ? (
          <>
            <span aria-hidden="true">·</span>
            <span>
              Mis à jour le{" "}
              <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
            </span>
          </>
        ) : null}
      </p>
    </div>
  )
}
