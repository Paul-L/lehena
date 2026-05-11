import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus"
import { Bold, Italic, Link as LinkIcon } from "lucide-react"
import * as React from "react"

import { LinkPopover } from "./link-popover"
import { ToolbarButton } from "./toolbar-button"

import type { Editor } from "@tiptap/react"

interface BubbleMenuProps {
  editor: Editor
}

export const EditorBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
  return (
    <TiptapBubbleMenu
      editor={editor}
      options={{
        placement: "top",
        offset: 8,
      }}
      shouldShow={({ editor: ed, state }) => {
        const { from, to } = state.selection
        if (from === to) return false
        if (!ed.isEditable) return false
        // Don't show on image / code blocks
        if (ed.isActive("image")) return false
        if (ed.isActive("codeBlock")) return false
        return true
      }}
      className="flex items-center gap-1 rounded-md border border-ui-border-base bg-ui-bg-base shadow-elevation-flyout p-1"
    >
      <ToolbarButton
        icon={Bold}
        label="Gras"
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Italique"
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <LinkPopover editor={editor}>
        <ToolbarButton
          icon={LinkIcon}
          label="Lien"
          isActive={editor.isActive("link")}
        />
      </LinkPopover>
    </TiptapBubbleMenu>
  )
}
