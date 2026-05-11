import { Button, Input, Label } from "@medusajs/ui"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Quote, Trash2 } from "lucide-react"
import * as React from "react"

import type { NodeViewProps } from "@tiptap/react"

/**
 * BlockQuotePress — a press quote with author + outlet + optional outlet logo.
 * Stored JSON shape:
 *   { type: "press-quote", attrs: { quote, author, outlet, outlet_logo_url } }
 *
 * The node is atom (no inline content) — the quote text lives in `attrs.quote`
 * so the schema stays flat and easy to render on the storefront.
 */
const PressQuoteView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  return (
    <NodeViewWrapper className="my-6 rounded-md border border-ui-border-base bg-ui-bg-subtle p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-ui-fg-subtle">
          <Quote className="h-3.5 w-3.5" />
          Citation presse
        </span>
        <Button variant="transparent" size="small" onClick={() => deleteNode()}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3">
        <div>
          <Label htmlFor="pq-quote">Citation</Label>
          <textarea
            id="pq-quote"
            className="mt-1 w-full rounded-md border border-ui-border-base bg-ui-bg-base p-2 text-sm"
            rows={3}
            value={node.attrs.quote ?? ""}
            onChange={(e) => updateAttributes({ quote: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pq-author">Auteur</Label>
            <Input
              id="pq-author"
              value={node.attrs.author ?? ""}
              onChange={(e) => updateAttributes({ author: e.target.value })}
              placeholder="ex: Marie Dupont"
            />
          </div>
          <div>
            <Label htmlFor="pq-outlet">Média</Label>
            <Input
              id="pq-outlet"
              value={node.attrs.outlet ?? ""}
              onChange={(e) => updateAttributes({ outlet: e.target.value })}
              placeholder="ex: Le Monde"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pq-logo">Logo URL (optionnel)</Label>
          <Input
            id="pq-logo"
            value={node.attrs.outlet_logo_url ?? ""}
            onChange={(e) =>
              updateAttributes({ outlet_logo_url: e.target.value })
            }
            placeholder="https://…"
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const PressQuoteNode = Node.create({
  name: "press-quote",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      quote: { default: "" },
      author: { default: "" },
      outlet: { default: "" },
      outlet_logo_url: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-press-quote]",
        getAttrs: (el) => {
          const node = el as HTMLElement
          return {
            quote: node.getAttribute("data-quote"),
            author: node.getAttribute("data-author"),
            outlet: node.getAttribute("data-outlet"),
            outlet_logo_url: node.getAttribute("data-logo"),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-press-quote": "",
        "data-quote": HTMLAttributes.quote,
        "data-author": HTMLAttributes.author,
        "data-outlet": HTMLAttributes.outlet,
        "data-logo": HTMLAttributes.outlet_logo_url ?? "",
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PressQuoteView)
  },
})
