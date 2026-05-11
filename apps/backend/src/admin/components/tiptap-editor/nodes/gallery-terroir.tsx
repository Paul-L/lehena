import { Button, Input, Label } from "@medusajs/ui"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { ImagePlus, Trash2, X } from "lucide-react"
import * as React from "react"

import type { NodeViewProps } from "@tiptap/react"

interface GalleryItem {
  src: string
  alt?: string
  caption?: string
}

/**
 * GalleryTerroir — horizontal gallery (3-6 images) for terroir/farm visuals.
 * JSON: { type: "gallery-terroir", attrs: { items: GalleryItem[] } }
 */
const GalleryView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const items: GalleryItem[] = node.attrs.items ?? []

  const update = (idx: number, patch: Partial<GalleryItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    updateAttributes({ items: next })
  }
  const add = () => {
    updateAttributes({ items: [...items, { src: "", alt: "", caption: "" }] })
  }
  const remove = (idx: number) => {
    updateAttributes({ items: items.filter((_, i) => i !== idx) })
  }

  return (
    <NodeViewWrapper className="my-6 rounded-md border border-ui-border-base bg-ui-bg-subtle p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-ui-fg-subtle">
          <ImagePlus className="h-3.5 w-3.5" />
          Galerie terroir ({items.length})
        </span>
        <Button variant="transparent" size="small" onClick={() => deleteNode()}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-ui-border-base bg-ui-bg-base p-3"
          >
            <div className="grid gap-2">
              <div>
                <Label htmlFor={`gt-src-${idx}`}>Image URL</Label>
                <Input
                  id={`gt-src-${idx}`}
                  value={it.src}
                  onChange={(e) => update(idx, { src: e.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`gt-alt-${idx}`}>Alt</Label>
                  <Input
                    id={`gt-alt-${idx}`}
                    value={it.alt ?? ""}
                    onChange={(e) => update(idx, { alt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`gt-cap-${idx}`}>Légende</Label>
                  <Input
                    id={`gt-cap-${idx}`}
                    value={it.caption ?? ""}
                    onChange={(e) => update(idx, { caption: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <Button
              variant="transparent"
              size="small"
              onClick={() => remove(idx)}
              aria-label="Supprimer l'image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="small" onClick={add}>
          + Ajouter une image
        </Button>
      </div>
    </NodeViewWrapper>
  )
}

export const GalleryTerroirNode = Node.create({
  name: "gallery-terroir",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: { default: [] as GalleryItem[] },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-gallery-terroir]",
        getAttrs: (el) => {
          const node = el as HTMLElement
          try {
            const raw = node.getAttribute("data-items") ?? "[]"
            return { items: JSON.parse(raw) as GalleryItem[] }
          } catch {
            return { items: [] }
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-gallery-terroir": "",
        "data-items": JSON.stringify(HTMLAttributes.items ?? []),
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryView)
  },
})
