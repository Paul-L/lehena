import { Button, Input } from "@medusajs/ui"
import { Node, mergeAttributes } from "@tiptap/core"
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react"
import { AlertTriangle, Info, Lightbulb, Trash2 } from "lucide-react"
import * as React from "react"

import type { NodeViewProps } from "@tiptap/react"

const TONE_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  info: { icon: Info, label: "Info" },
  note: { icon: Lightbulb, label: "Le saviez-vous ?" },
  warning: { icon: AlertTriangle, label: "Attention" },
}

/**
 * Callout — soft block ("Le saviez-vous ?" / "À noter") with a tone + title +
 * inline content. JSON: { type: "callout", attrs: { tone, title }, content: [...] }
 */
const CalloutView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const tone = (node.attrs.tone as keyof typeof TONE_META) ?? "info"
  const meta = TONE_META[tone] ?? TONE_META.info
  const Icon = meta.icon

  return (
    <NodeViewWrapper className="my-4 rounded-md border border-ui-border-base bg-ui-bg-subtle p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-ui-fg-subtle" />
          <select
            className="rounded border border-ui-border-base bg-ui-bg-base px-1 py-0.5 text-xs"
            value={tone}
            onChange={(e) => updateAttributes({ tone: e.target.value })}
          >
            {Object.entries(TONE_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <Input
            value={node.attrs.title ?? ""}
            placeholder="Titre (optionnel)"
            onChange={(e) => updateAttributes({ title: e.target.value })}
            className="max-w-xs"
          />
        </div>
        <Button variant="transparent" size="small" onClick={() => deleteNode()}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="rounded bg-ui-bg-base p-2 [&_p]:my-1">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}

export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      tone: { default: "info" },
      title: { default: "" },
    }
  },

  parseHTML() {
    return [
      {
        tag: "aside[data-callout]",
        getAttrs: (el) => {
          const node = el as HTMLElement
          return {
            tone: node.getAttribute("data-tone") ?? "info",
            title: node.getAttribute("data-title") ?? "",
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "",
        "data-tone": HTMLAttributes.tone ?? "info",
        "data-title": HTMLAttributes.title ?? "",
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },
})
