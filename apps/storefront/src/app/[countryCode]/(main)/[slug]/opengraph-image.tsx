import { getPageBySlug } from "@lib/data/pages"
import { localeForCountry } from "@lib/i18n/locale-map"
import {
  fetchImageAsDataURL,
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SITE_NAME,
  OG_SITE_TAGLINE,
  OG_SIZE,
} from "@lib/seo/og"
import { ImageResponse } from "next/og"

// Node runtime to reuse the SDK data helpers + Buffer for base64 embedding.
// Weekly cache — CMS/editorial OG images change rarely.
export const runtime = "nodejs"
export const revalidate = 604800

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = OG_SITE_NAME

interface Props {
  params: Promise<{ countryCode: string; slug: string }>
}

const TYPE_LABELS: Record<string, string> = {
  article: "Article",
  recipe: "Recette",
  news: "Actualité",
  page: "",
}

export default async function PageOgImage({ params }: Props) {
  const { countryCode, slug } = await params
  const locale = localeForCountry(countryCode)

  const result = await getPageBySlug(slug, { locale }).catch(() => null)
  const page = result?.page ?? null

  const title = page?.meta_title ?? page?.title ?? OG_SITE_NAME
  const subtitle = page?.excerpt ?? page?.meta_description ?? OG_SITE_TAGLINE
  const kicker = (page?.type && TYPE_LABELS[page.type]) || OG_SITE_NAME
  const bgImage = await fetchImageAsDataURL(page?.og_image_url)

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: OG_COLORS.cream,
        fontFamily: "sans-serif",
      }}
    >
      {bgImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgImage}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            width: 1200,
            height: 630,
            objectFit: "cover",
            opacity: 0.18,
          }}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: OG_COLORS.rouge,
            fontWeight: 700,
          }}
        >
          {kicker}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 40 ? 62 : 78,
              lineHeight: 1.05,
              fontWeight: 800,
              color: OG_COLORS.ink,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 34,
              lineHeight: 1.3,
              color: OG_COLORS.muted,
            }}
          >
            {subtitle.length > 140 ? `${subtitle.slice(0, 137)}…` : subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            color: OG_COLORS.rouge,
          }}
        >
          {OG_SITE_NAME}
        </div>
      </div>
    </div>,
    { ...size }
  )
}
