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

/* ----------------------------------------------------------------------- */
/* Marks                                                                   */
/* ----------------------------------------------------------------------- */

function applyMarks(
  text: string,
  marks: NonNullable<JSONContent["marks"]>,
  keyBase: string
): React.ReactNode {
  // Walk from innermost to outermost — the order in the marks array is
  // outermost first per the ProseMirror spec, so we wrap from the end.
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
        if (!href) {
          // Defensive: skip the mark if we don't have an href.
          break
        }
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
/* Nodes                                                                   */
/* ----------------------------------------------------------------------- */

function renderChildren(
  nodes: JSONContent[] | undefined,
  keyPath: string
): React.ReactNode[] {
  if (!nodes) return []
  return nodes.map((child, idx) => renderNode(child, `${keyPath}.${idx}`))
}

function renderNode(node: JSONContent, key: string): React.ReactNode {
  switch (node.type) {
    case "doc":
      return (
        <React.Fragment key={key}>
          {renderChildren(node.content, key)}
        </React.Fragment>
      )

    case "paragraph": {
      const children = renderChildren(node.content, key)
      // Empty paragraphs preserve vertical rhythm — render an explicit <br>
      // so the styled `<p>` rule still has a baseline.
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
          {renderChildren(node.content, key)}
        </Tag>
      )
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6 my-4 space-y-1">
          {renderChildren(node.content, key)}
        </ul>
      )

    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-6 my-4 space-y-1">
          {renderChildren(node.content, key)}
        </ol>
      )

    case "listItem":
      return <li key={key}>{renderChildren(node.content, key)}</li>

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-6"
        >
          {renderChildren(node.content, key)}
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
      // Plain <img> with lazy loading. Avoids requiring next/image domain
      // configuration for arbitrary CMS uploads. next/image can be opted
      // into per-domain later if image perf becomes a concern.
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
/* Public component                                                         */
/* ----------------------------------------------------------------------- */

interface TiptapContentProps {
  content: JSONContent | null | undefined
  className?: string
}

/**
 * Server-rendered TipTap content. Accepts a JSON document as produced by
 * the editor and emits static HTML — no client JS, no hydration, no editor
 * deps in the bundle.
 */
export const TiptapContent: React.FC<TiptapContentProps> = ({
  content,
  className,
}) => {
  if (!content) return null
  return (
    <div className={clx("text-base text-gray-900", className)}>
      {renderNode(content, "root")}
    </div>
  )
}
