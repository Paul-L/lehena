import { clx } from "@medusajs/ui"
import * as React from "react"

/**
 * Local TipTap JSON shape — mirrors `@tiptap/core`'s JSONContent without
 * pulling the editor and ProseMirror into the storefront bundle.
 */
export interface JSONContent {
  type?: string
  attrs?: Record<string, unknown>
  content?: JSONContent[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

interface LinkAttrs {
  href?: string
  target?: string
  rel?: string
}

const ALLOWED_HEADING_LEVELS = [2, 3, 4] as const
type HeadingLevel = (typeof ALLOWED_HEADING_LEVELS)[number]

const isString = (v: unknown): v is string => typeof v === "string"
const isNumber = (v: unknown): v is number => typeof v === "number"

/** Snapshot of a product, resolved at page render time and passed through. */
export interface LiveProduct {
  id?: string
  handle: string
  title: string
  thumbnail?: string | null
  /** Already formatted, e.g. "12,90 €" — formatting is page-side. */
  cheapest_price?: string | null
}

interface RenderContext {
  /** Map keyed by product handle. Missing entries fall back to the snapshot. */
  liveProducts?: Map<string, LiveProduct>
  /** Country code used to build product/category links. */
  countryCode?: string
}

/* ----------------------------------------------------------------------- */
/* Marks                                                                   */
/* ----------------------------------------------------------------------- */

function applyMarks(
  text: string,
  marks: NonNullable<JSONContent["marks"]>,
  keyBase: string
): React.ReactNode {
  let node: React.ReactNode = text
  for (let i = marks.length - 1; i >= 0; i--) {
    const mark = marks[i]
    const key = `${keyBase}-mark-${i}`
    switch (mark.type) {
      case "bold":
        node = <strong key={key}>{node}</strong>
        break
      case "italic":
        node = <em key={key}>{node}</em>
        break
      case "strike":
        node = <s key={key}>{node}</s>
        break
      case "code":
        node = (
          <code
            key={key}
            className="rounded bg-ui-bg-subtle px-1 py-0.5 text-[0.9em] font-mono"
          >
            {node}
          </code>
        )
        break
      case "underline":
        node = <u key={key}>{node}</u>
        break
      case "link": {
        const attrs = (mark.attrs as LinkAttrs) ?? {}
        const href = attrs.href
        if (!href) break
        node = (
          <a
            key={key}
            href={href}
            target={attrs.target ?? "_blank"}
            rel={attrs.rel ?? "noopener noreferrer"}
            className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
          >
            {node}
          </a>
        )
        break
      }
      default:
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[tiptap-renderer] Unknown mark "${mark.type}" — skipped.`
          )
        }
    }
  }
  return node
}

/* ----------------------------------------------------------------------- */
/* Custom node renderers                                                   */
/* ----------------------------------------------------------------------- */

function renderPressQuote(node: JSONContent, key: string): React.ReactNode {
  const attrs = node.attrs ?? {}
  const quote = isString(attrs.quote) ? attrs.quote : ""
  const author = isString(attrs.author) ? attrs.author : ""
  const outlet = isString(attrs.outlet) ? attrs.outlet : ""
  const logo = isString(attrs.outlet_logo_url) ? attrs.outlet_logo_url : null
  return (
    <figure
      key={key}
      className="my-10 border-l-2 border-[color:var(--rouge)] pl-6"
      style={{ fontFamily: "var(--serif-display)" }}
    >
      <blockquote
        className="text-2xl leading-snug"
        style={{ color: "var(--ink)" }}
      >
        « {quote} »
      </blockquote>
      <figcaption
        className="mt-3 flex items-center gap-3"
        style={{ color: "var(--ink-mute)" }}
      >
        {logo ? (
          <img
            src={logo}
            alt={outlet}
            className="h-6 w-auto opacity-80"
            loading="lazy"
          />
        ) : null}
        <span
          className="mono"
          style={{ fontSize: 11, letterSpacing: "0.08em" }}
        >
          {author}
          {author && outlet ? " · " : ""}
          {outlet}
        </span>
      </figcaption>
    </figure>
  )
}

function renderGalleryTerroir(node: JSONContent, key: string): React.ReactNode {
  const items = Array.isArray(node.attrs?.items)
    ? (node.attrs!.items as {
        src?: unknown
        alt?: unknown
        caption?: unknown
      }[])
    : []
  const usable = items
    .map((it) => ({
      src: isString(it.src) ? it.src : null,
      alt: isString(it.alt) ? it.alt : "",
      caption: isString(it.caption) ? it.caption : "",
    }))
    .filter((it) => !!it.src) as { src: string; alt: string; caption: string }[]
  if (usable.length === 0) return null
  return (
    <div
      key={key}
      className="my-10 -mx-4 overflow-x-auto px-4"
      role="region"
      aria-label="Galerie"
    >
      <div className="flex gap-3 snap-x snap-mandatory">
        {usable.map((it, idx) => (
          <figure
            key={`${key}-${idx}`}
            className="min-w-[260px] max-w-[320px] flex-1 snap-start"
          >
            <img
              src={it.src}
              alt={it.alt}
              loading="lazy"
              className="h-72 w-full rounded object-cover"
            />
            {it.caption ? (
              <figcaption
                className="mono mt-2"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: "var(--ink-mute)",
                }}
              >
                {it.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </div>
  )
}

function renderProductEmbed(
  node: JSONContent,
  key: string,
  ctx: RenderContext
): React.ReactNode {
  const attrs = node.attrs ?? {}
  const handle = isString(attrs.product_handle) ? attrs.product_handle : null
  if (!handle) return null
  const live = ctx.liveProducts?.get(handle)
  const title =
    live?.title ??
    (isString(attrs.product_title) ? attrs.product_title : handle)
  const thumb =
    live?.thumbnail ??
    (isString(attrs.product_thumbnail) ? attrs.product_thumbnail : null)
  const price = live?.cheapest_price ?? null
  const countryCode = ctx.countryCode ?? "fr"
  return (
    <a
      key={key}
      href={`/${countryCode}/products/${handle}`}
      className="my-6 flex items-center gap-4 rounded border border-[color:var(--line)] bg-[color:var(--bg-elevated)] p-3 hover:border-[color:var(--ink)] transition-colors"
    >
      {thumb ? (
        <img
          src={thumb}
          alt={title}
          loading="lazy"
          className="h-20 w-20 rounded object-cover"
        />
      ) : (
        <div className="h-20 w-20 rounded bg-[color:var(--bg)]" />
      )}
      <div className="flex-1 min-w-0">
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            color: "var(--ink-mute)",
          }}
        >
          PRODUIT
        </div>
        <div
          className="serif-display truncate"
          style={{ fontSize: 18, color: "var(--ink)" }}
        >
          {title}
        </div>
        {price ? (
          <div
            className="serif"
            style={{ fontSize: 15, color: "var(--ink-soft)" }}
          >
            Dès {price}
          </div>
        ) : null}
      </div>
      <span
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          color: "var(--ink-mute)",
        }}
      >
        VOIR →
      </span>
    </a>
  )
}

function renderCallout(
  node: JSONContent,
  key: string,
  children: React.ReactNode
): React.ReactNode {
  const tone = isString(node.attrs?.tone)
    ? (node.attrs!.tone as string)
    : "info"
  const title = isString(node.attrs?.title) ? (node.attrs!.title as string) : ""
  const borderColor =
    tone === "warning"
      ? "var(--rouge)"
      : tone === "note"
        ? "var(--olive, #6b7a4a)"
        : "var(--ink-mute)"
  return (
    <aside
      key={key}
      className="my-8 rounded border-l-2 bg-[color:var(--bg-elevated)] p-4"
      style={{ borderLeftColor: borderColor }}
    >
      {title ? (
        <div
          className="eyebrow"
          style={{ color: "var(--ink-mute)", marginBottom: 6 }}
        >
          {title}
        </div>
      ) : null}
      <div className="[&_p]:my-1 [&_p]:leading-relaxed">{children}</div>
    </aside>
  )
}

function renderRecipeStep(
  node: JSONContent,
  key: string,
  children: React.ReactNode
): React.ReactNode {
  const stepNumber = isNumber(node.attrs?.step_number)
    ? (node.attrs!.step_number as number)
    : 1
  const duration = isNumber(node.attrs?.duration_min)
    ? (node.attrs!.duration_min as number)
    : null
  return (
    <div
      key={key}
      className="my-5 grid grid-cols-[auto_1fr] gap-4 border-t border-[color:var(--line)] pt-5"
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className="serif-display flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--ink)] text-lg"
          style={{ color: "var(--ink)" }}
        >
          {stepNumber}
        </div>
        {duration !== null ? (
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--ink-mute)",
            }}
          >
            {duration} MIN
          </span>
        ) : null}
      </div>
      <div className="[&_p]:my-1 [&_p]:leading-relaxed">{children}</div>
    </div>
  )
}

/* ----------------------------------------------------------------------- */
/* Core walker                                                             */
/* ----------------------------------------------------------------------- */

function renderChildren(
  nodes: JSONContent[] | undefined,
  keyPath: string,
  ctx: RenderContext
): React.ReactNode[] {
  if (!nodes) return []
  return nodes.map((child, idx) => renderNode(child, `${keyPath}.${idx}`, ctx))
}

function renderNode(
  node: JSONContent,
  key: string,
  ctx: RenderContext
): React.ReactNode {
  switch (node.type) {
    case "doc":
      return (
        <React.Fragment key={key}>
          {renderChildren(node.content, key, ctx)}
        </React.Fragment>
      )

    case "paragraph": {
      const children = renderChildren(node.content, key, ctx)
      return (
        <p key={key} className="my-3 leading-relaxed">
          {children.length === 0 ? <br /> : children}
        </p>
      )
    }

    case "heading": {
      const rawLevel = (node.attrs?.level as number | undefined) ?? 2
      const level: HeadingLevel = (
        ALLOWED_HEADING_LEVELS.includes(rawLevel as HeadingLevel) ? rawLevel : 2
      ) as HeadingLevel
      const Tag = `h${level}` as unknown as keyof React.JSX.IntrinsicElements
      const sizeClass =
        level === 2
          ? "text-3xl mt-10 mb-4"
          : level === 3
            ? "text-2xl mt-8 mb-3"
            : "text-xl mt-6 mb-2"
      return (
        <Tag
          key={key}
          className={clx("font-semibold leading-tight", sizeClass)}
        >
          {renderChildren(node.content, key, ctx)}
        </Tag>
      )
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6 my-4 space-y-1">
          {renderChildren(node.content, key, ctx)}
        </ul>
      )

    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-6 my-4 space-y-1">
          {renderChildren(node.content, key, ctx)}
        </ol>
      )

    case "listItem":
      return <li key={key}>{renderChildren(node.content, key, ctx)}</li>

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-6"
        >
          {renderChildren(node.content, key, ctx)}
        </blockquote>
      )

    case "codeBlock": {
      const lang = isString(node.attrs?.language)
        ? (node.attrs!.language as string)
        : null
      const text = (node.content ?? [])
        .filter((c) => c.type === "text" && isString(c.text))
        .map((c) => c.text as string)
        .join("")
      return (
        <pre
          key={key}
          className="rounded-md bg-gray-900 text-gray-100 p-4 my-6 overflow-x-auto text-sm font-mono"
        >
          <code className={lang ? `language-${lang}` : undefined}>{text}</code>
        </pre>
      )
    }

    case "horizontalRule":
      return <hr key={key} className="my-8 border-t border-gray-200" />

    case "hardBreak":
      return <br key={key} />

    case "image": {
      const attrs = node.attrs ?? {}
      const src = isString(attrs.src) ? attrs.src : null
      if (!src) return null
      const alt = isString(attrs.alt) ? attrs.alt : ""
      const width = isNumber(attrs.width) ? attrs.width : undefined
      const height = isNumber(attrs.height) ? attrs.height : undefined
      const title = isString(attrs.title) ? attrs.title : undefined
      return (
        <img
          key={key}
          src={src}
          alt={alt}
          title={title}
          width={width}
          height={height}
          loading="lazy"
          className="rounded-lg max-w-full h-auto my-6 mx-auto"
        />
      )
    }

    case "text": {
      const text = node.text ?? ""
      if (!node.marks || node.marks.length === 0) {
        return <React.Fragment key={key}>{text}</React.Fragment>
      }
      return (
        <React.Fragment key={key}>
          {applyMarks(text, node.marks, key)}
        </React.Fragment>
      )
    }

    case "press-quote":
      return renderPressQuote(node, key)

    case "gallery-terroir":
      return renderGalleryTerroir(node, key)

    case "product-embed":
      return renderProductEmbed(node, key, ctx)

    case "callout":
      return renderCallout(node, key, renderChildren(node.content, key, ctx))

    case "recipe-step":
      return renderRecipeStep(node, key, renderChildren(node.content, key, ctx))

    default:
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[tiptap-renderer] Unknown node type "${node.type}" — skipped.`
        )
      }
      return null
  }
}

/* ----------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ----------------------------------------------------------------------- */

/**
 * Walks a TipTap doc and collects every product handle referenced by
 * `product-embed` nodes. Used by pages to prefetch live product data before
 * rendering, so the renderer can stay synchronous.
 */
export function extractProductEmbedHandles(
  content: JSONContent | null | undefined
): string[] {
  if (!content) return []
  const handles = new Set<string>()
  const walk = (node: JSONContent) => {
    if (node.type === "product-embed") {
      const h = node.attrs?.product_handle
      if (isString(h) && h.length > 0) handles.add(h)
    }
    node.content?.forEach(walk)
  }
  walk(content)
  return Array.from(handles)
}

/* ----------------------------------------------------------------------- */
/* Public component                                                         */
/* ----------------------------------------------------------------------- */

interface TiptapContentProps {
  content: JSONContent | null | undefined
  className?: string
  liveProducts?: Map<string, LiveProduct>
  countryCode?: string
}

/**
 * Server-rendered TipTap content. Accepts a JSON document as produced by
 * the editor and emits static HTML — no client JS, no hydration, no editor
 * deps in the bundle.
 */
export const TiptapContent: React.FC<TiptapContentProps> = ({
  content,
  className,
  liveProducts,
  countryCode,
}) => {
  if (!content) return null
  return (
    <div className={clx("text-base text-gray-900", className)}>
      {renderNode(content, "root", { liveProducts, countryCode })}
    </div>
  )
}
