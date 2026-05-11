import { Button, Input, Label } from "@medusajs/ui"
import { Node, mergeAttributes } from "@tiptap/core"
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react"
import { ChefHat, Trash2 } from "lucide-react"
import * as React from "react"

import type { NodeViewProps } from "@tiptap/react"

/**
 * RecipeStep — a numbered step with an optional duration (minutes).
 * JSON: { type: "recipe-step", attrs: { step_number, duration_min }, content: [...] }
 */
const RecipeStepView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  return (
    <NodeViewWrapper className="my-3 rounded-md border border-ui-border-base bg-ui-bg-subtle p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-ui-fg-subtle" />
          <div className="flex items-center gap-2">
            <Label htmlFor="rs-num">Étape</Label>
            <Input
              id="rs-num"
              type="number"
              min={1}
              value={node.attrs.step_number ?? 1}
              onChange={(e) =>
                updateAttributes({
                  step_number: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-16"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="rs-dur">Durée (min)</Label>
            <Input
              id="rs-dur"
              type="number"
              min={0}
              value={node.attrs.duration_min ?? ""}
              onChange={(e) => {
                const v = e.target.value
                updateAttributes({
                  duration_min: v === "" ? null : parseInt(v, 10) || null,
                })
              }}
              className="w-20"
            />
          </div>
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

export const RecipeStepNode = Node.create({
  name: "recipe-step",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      step_number: { default: 1 },
      duration_min: { default: null as number | null },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-recipe-step]",
        getAttrs: (el) => {
          const node = el as HTMLElement
          const num = parseInt(node.getAttribute("data-step") ?? "1", 10)
          const dur = node.getAttribute("data-duration")
          return {
            step_number: Number.isFinite(num) ? num : 1,
            duration_min: dur ? parseInt(dur, 10) : null,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-recipe-step": "",
        "data-step": HTMLAttributes.step_number,
        "data-duration": HTMLAttributes.duration_min ?? "",
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(RecipeStepView)
  },
})
