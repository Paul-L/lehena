import Image from "next/image"

interface FriezeProps {
  color?: string
  size?: number
  opacity?: number
}

export const Frieze = ({
  color = "var(--ink)",
  size = 12,
  opacity = 1,
}: FriezeProps) => (
  <div
    style={{
      height: size,
      width: "100%",
      opacity,
      background: `
        linear-gradient(135deg, transparent 25%, ${color} 25% 50%, transparent 50%) 0 0/${size}px ${size}px,
        linear-gradient(45deg,  transparent 25%, ${color} 25% 50%, transparent 50%) 0 0/${size}px ${size}px
      `,
    }}
  />
)

type PlaceholderTone =
  | "kraft"
  | "rouge"
  | "encre"
  | "creme"
  | "olive"
  | "argile"

interface PlaceholderProps {
  label?: string
  aspect?: string
  tone?: PlaceholderTone
  style?: React.CSSProperties
  className?: string
}

const PALETTES: Record<
  PlaceholderTone,
  { bg: string; stripe: string; ink: string }
> = {
  kraft: { bg: "#ede2ce", stripe: "#d8c8a8", ink: "#5a4a3a" },
  rouge: { bg: "#a83925", stripe: "#7a2818", ink: "#f4ede0" },
  encre: { bg: "#1c1410", stripe: "#2a1d16", ink: "#e9dcc1" },
  creme: { bg: "#f4ede0", stripe: "#e3d6bb", ink: "#5a4a3a" },
  olive: { bg: "#5a5a3a", stripe: "#444429", ink: "#f0e6d2" },
  argile: { bg: "#c08a6b", stripe: "#a3704f", ink: "#1c1410" },
}

export const Placeholder = ({
  label = "Photo",
  aspect = "1/1",
  tone = "kraft",
  style,
  className,
}: PlaceholderProps) => {
  const p = PALETTES[tone]
  return (
    <div
      className={className}
      style={{
        position: "relative",
        aspectRatio: aspect,
        background: `repeating-linear-gradient(45deg, ${p.bg}, ${p.bg} 14px, ${p.stripe} 14px, ${p.stripe} 28px)`,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            background: p.bg,
            color: p.ink,
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            padding: "6px 12px",
            border: `1px solid ${p.ink}`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

interface PhotoProps {
  /** Path under /public, e.g. "/images/home-atelier.webp" */
  src: string
  /** Descriptive alt text (SEO + a11y). Empty string = decorative. */
  alt: string
  aspect?: string
  /** Responsive sizes hint for next/image. Defaults to a sensible full-width value. */
  sizes?: string
  /** Eager-load above-the-fold images. */
  priority?: boolean
  style?: React.CSSProperties
  className?: string
}

/**
 * Editorial photo frame — drop-in replacement for <Placeholder>.
 * Renders an optimized next/image with object-fit: cover inside a sized,
 * relatively-positioned container (mirrors Placeholder's style/className API).
 */
export const Photo = ({
  src,
  alt,
  aspect,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  style,
  className,
}: PhotoProps) => (
  <div
    className={className}
    style={{
      position: "relative",
      overflow: "hidden",
      ...(aspect && aspect !== "auto" ? { aspectRatio: aspect } : {}),
      ...style,
    }}
  >
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      style={{ objectFit: "cover" }}
    />
  </div>
)

interface LogoProps {
  height?: number
  invert?: boolean
}

export const Logo = ({ height = 36, invert = false }: LogoProps) => (
  <div
    aria-label="Maison Lehena"
    style={{
      display: "inline-flex",
      alignItems: "center",
      height,
      filter: invert ? "brightness(0) invert(1)" : "none",
    }}
  >
    <Image
      src="/assets/logo-lehena.png"
      alt="Maison Lehena"
      width={600}
      height={191}
      priority
      style={{
        height: "100%",
        width: "auto",
        display: "block",
      }}
    />
  </div>
)
