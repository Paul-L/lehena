import { getProductDetails } from "@lib/data/product-details"
import {
  fetchImageAsDataURL,
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SITE_NAME,
  OG_SIZE,
} from "@lib/seo/og"
import { ImageResponse } from "next/og"

// Run on Node so we can reuse the server data helpers (SDK fetch, Buffer for
// base64 image embedding). Cache the generated PNG for a week — product OG
// images change rarely.
export const runtime = "nodejs"
export const revalidate = 604800

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `${OG_SITE_NAME} — produit`

interface Props {
  params: Promise<{ countryCode: string; handle: string }>
}

/** Cheapest variant price, formatted as EUR, or null when unavailable. */
function formatCheapestPrice(
  variants:
    | {
        calculated_price?: {
          calculated_amount?: number | null
          currency_code?: string | null
        } | null
      }[]
    | undefined
): string | null {
  if (!variants?.length) return null
  const priced = variants
    .map((v) => v.calculated_price)
    .filter(
      (p): p is { calculated_amount: number; currency_code: string } =>
        typeof p?.calculated_amount === "number" &&
        typeof p?.currency_code === "string"
    )
  if (priced.length === 0) return null
  const cheapest = priced.reduce((a, b) =>
    a.calculated_amount <= b.calculated_amount ? a : b
  )
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: cheapest.currency_code,
    }).format(cheapest.calculated_amount)
  } catch {
    return null
  }
}

export default async function ProductOgImage({ params }: Props) {
  const { countryCode, handle } = await params

  // Never throw: any data failure degrades to a clean text-only card.
  const product = await getProductDetails(handle, countryCode).catch(() => null)

  const title = product?.title ?? OG_SITE_NAME
  const price = formatCheapestPrice(product?.variants)
  const nitriteFree = product?.product_details?.nitrite_free === true
  const imageSrc = await fetchImageAsDataURL(
    product?.product_details?.og_image_url ??
      product?.thumbnail ??
      product?.images?.[0]?.url
  )

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
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          width={520}
          height={630}
          style={{ width: 520, height: 630, objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
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
          {OG_SITE_NAME}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 40 ? 58 : 72,
              lineHeight: 1.05,
              fontWeight: 800,
              color: OG_COLORS.ink,
            }}
          >
            {title}
          </div>
          {nitriteFree ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                marginTop: 28,
                padding: "12px 24px",
                borderRadius: 999,
                background: OG_COLORS.rouge,
                color: OG_COLORS.cream,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              Sans nitrite
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: OG_COLORS.muted,
            }}
          >
            Maître artisan charcutier au Pays Basque
          </div>
          {price ? (
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 800,
                color: OG_COLORS.rouge,
              }}
            >
              {price}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    { ...size }
  )
}
