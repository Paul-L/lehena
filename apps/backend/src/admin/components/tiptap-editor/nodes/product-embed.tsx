import { Button, Drawer, IconButton, Input } from "@medusajs/ui"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Pencil, Package, Search, Trash2 } from "lucide-react"
import * as React from "react"

import { sdk } from "../../../lib/sdk"

import type { NodeViewProps } from "@tiptap/react"

interface ProductHit {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
}

/**
 * ProductEmbed — embeds a single product card inside an article.
 * JSON: { type: "product-embed", attrs: { product_id, product_handle, product_title, product_thumbnail } }
 *
 * We persist the handle + a snapshot of title/thumbnail so the storefront can
 * render an instant skeleton, then re-hydrate with live price by fetching the
 * product server-side at render time. Always pick by handle (stable across
 * environments), not id.
 */
const ProductEmbedView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [hits, setHits] = React.useState<ProductHit[]>([])
  const [loading, setLoading] = React.useState(false)
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    if (!open) return
    if (debounce.current) clearTimeout(debounce.current)
    setLoading(true)
    debounce.current = setTimeout(async () => {
      try {
        const res = await sdk.admin.product.list({
          q: query || undefined,
          limit: 20,
          fields: "id,title,handle,thumbnail",
        })
        const list = (res.products ?? []) as ProductHit[]
        setHits(list)
      } catch {
        setHits([])
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [open, query])

  const pick = (p: ProductHit) => {
    updateAttributes({
      product_id: p.id,
      product_handle: p.handle,
      product_title: p.title,
      product_thumbnail: p.thumbnail ?? null,
    })
    setOpen(false)
  }

  const hasPick = !!node.attrs.product_handle

  return (
    <NodeViewWrapper className="my-4 rounded-md border border-ui-border-base bg-ui-bg-subtle p-3">
      <div className="flex items-center gap-3">
        <Package className="h-4 w-4 text-ui-fg-subtle" />
        {hasPick ? (
          <div className="flex flex-1 items-center gap-3">
            {node.attrs.product_thumbnail ? (
              <img
                src={node.attrs.product_thumbnail}
                alt=""
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-ui-bg-base" />
            )}
            <div className="flex flex-col">
              <span className="font-medium">{node.attrs.product_title}</span>
              <span className="text-xs text-ui-fg-subtle">
                /{node.attrs.product_handle}
              </span>
            </div>
          </div>
        ) : (
          <span className="flex-1 text-sm text-ui-fg-subtle">
            Aucun produit sélectionné
          </span>
        )}
        <IconButton
          variant="transparent"
          size="small"
          onClick={() => setOpen(true)}
          aria-label="Choisir un produit"
        >
          <Pencil className="h-4 w-4" />
        </IconButton>
        <IconButton
          variant="transparent"
          size="small"
          onClick={() => deleteNode()}
          aria-label="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Sélectionner un produit</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-ui-fg-subtle" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chercher par nom, handle…"
              />
            </div>
            {loading ? (
              <div className="text-sm text-ui-fg-subtle">Chargement…</div>
            ) : hits.length === 0 ? (
              <div className="text-sm text-ui-fg-subtle">
                Aucun produit trouvé.
              </div>
            ) : (
              <ul className="grid gap-2">
                {hits.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pick(p)}
                      className="flex w-full items-center gap-3 rounded border border-ui-border-base bg-ui-bg-base p-2 text-left hover:bg-ui-bg-base-hover"
                    >
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-ui-bg-subtle" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{p.title}</span>
                        <span className="text-xs text-ui-fg-subtle">
                          /{p.handle}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </NodeViewWrapper>
  )
}

export const ProductEmbedNode = Node.create({
  name: "product-embed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      product_id: { default: "" },
      product_handle: { default: "" },
      product_title: { default: "" },
      product_thumbnail: { default: null as string | null },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-product-embed]",
        getAttrs: (el) => {
          const node = el as HTMLElement
          return {
            product_id: node.getAttribute("data-id"),
            product_handle: node.getAttribute("data-handle"),
            product_title: node.getAttribute("data-title"),
            product_thumbnail: node.getAttribute("data-thumb"),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-product-embed": "",
        "data-id": HTMLAttributes.product_id ?? "",
        "data-handle": HTMLAttributes.product_handle ?? "",
        "data-title": HTMLAttributes.product_title ?? "",
        "data-thumb": HTMLAttributes.product_thumbnail ?? "",
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProductEmbedView)
  },
})
