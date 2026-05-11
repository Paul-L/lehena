import { getProductPrice } from "@lib/util/get-product-price"
import { type HttpTypes } from "@medusajs/types"
import { Placeholder } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

interface LehenaProductCardProps {
  product: HttpTypes.StoreProduct
  size?: "comfort" | "compact" | "spacious"
}

const TONES = ["rouge", "encre", "argile", "olive", "kraft", "creme"] as const

function pickTone(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return TONES[Math.abs(hash) % TONES.length]
}

export default function LehenaProductCard({
  product,
  size = "comfort",
}: LehenaProductCardProps) {
  const { cheapestPrice } = getProductPrice({ product })
  const image = product.thumbnail || product.images?.[0]?.url
  const tone = pickTone(product.id)
  const subtitle = product.subtitle || product.collection?.title || ""
  const category = product.categories?.[0]?.name
  const isCompact = size === "compact"
  const titleSize = isCompact ? 18 : size === "spacious" ? 26 : 22

  return (
    <article style={{ position: "relative" }} data-testid="product-wrapper">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        style={{ display: "block" }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            marginBottom: 16,
            background: "var(--paper)",
          }}
        >
          {image ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",
              }}
            >
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 720px) 50vw, (max-width: 1180px) 33vw, 25vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            <Placeholder label={product.title} aspect="4/5" tone={tone} />
          )}
          {category && (
            <div
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                maxWidth: "calc(100% - 28px)",
              }}
            >
              <span className="chip chip-solid" style={{ fontSize: 9 }}>
                {category}
              </span>
            </div>
          )}
        </div>
        {category && (
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {category}
          </div>
        )}
        <h3
          className="serif-display"
          data-testid="product-title"
          style={{ fontSize: titleSize, marginBottom: 4, lineHeight: 1.1 }}
        >
          {product.title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              marginBottom: 12,
            }}
          >
            {subtitle}
          </p>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          {cheapestPrice ? (
            <span className="serif" style={{ fontSize: 20 }}>
              {cheapestPrice.calculated_price}
            </span>
          ) : (
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--ink-mute)" }}
            >
              Sur demande
            </span>
          )}
        </div>
      </LocalizedClientLink>
    </article>
  )
}
