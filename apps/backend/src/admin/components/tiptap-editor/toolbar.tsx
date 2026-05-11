import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  CodeXml,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Newspaper,
  ImagePlus,
  Package,
  Lightbulb,
  ChefHat,
} from "lucide-react"
import * as React from "react"

import { LinkPopover } from "./link-popover"
import { ToolbarButton } from "./toolbar-button"

import type { Editor } from "@tiptap/react"

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform)
const mod = isMac ? "⌘" : "Ctrl"
const shift = isMac ? "⇧" : "Shift"

interface ToolbarProps {
  editor: Editor
  onImageClick: () => void
  imageUploading?: boolean
}

const Divider = () => <div className="mx-1 h-5 w-px bg-ui-border-base" />

export const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  onImageClick,
  imageUploading,
}) => {
  return (
    <div className="border-b border-ui-border-base bg-ui-bg-subtle p-2 flex items-center gap-1 flex-wrap sticky top-0 z-10">
      <ToolbarButton
        icon={Bold}
        label="Gras"
        shortcut={`${mod}+B`}
        isActive={editor.isActive("bold")}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Italique"
        shortcut={`${mod}+I`}
        isActive={editor.isActive("italic")}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={Strikethrough}
        label="Barré"
        shortcut={`${mod}+${shift}+S`}
        isActive={editor.isActive("strike")}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        icon={Code}
        label="Code (inline)"
        shortcut={`${mod}+E`}
        isActive={editor.isActive("code")}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />

      <Divider />

      <ToolbarButton
        icon={Heading2}
        label="Titre H2"
        shortcut={`${mod}+Alt+2`}
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3}
        label="Titre H3"
        shortcut={`${mod}+Alt+3`}
        isActive={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        icon={Heading4}
        label="Titre H4"
        shortcut={`${mod}+Alt+4`}
        isActive={editor.isActive("heading", { level: 4 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      />

      <Divider />

      <ToolbarButton
        icon={List}
        label="Liste à puces"
        shortcut={`${mod}+${shift}+8`}
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Liste numérotée"
        shortcut={`${mod}+${shift}+7`}
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <Divider />

      <ToolbarButton
        icon={Quote}
        label="Citation"
        shortcut={`${mod}+${shift}+B`}
        isActive={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={CodeXml}
        label="Bloc de code"
        shortcut={`${mod}+Alt+C`}
        isActive={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        icon={Minus}
        label="Séparateur"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      <Divider />

      <LinkPopover editor={editor}>
        <ToolbarButton
          icon={LinkIcon}
          label="Lien"
          shortcut={`${mod}+K`}
          isActive={editor.isActive("link")}
          disabled={editor.state.selection.empty && !editor.isActive("link")}
        />
      </LinkPopover>
      <ToolbarButton
        icon={ImageIcon}
        label={imageUploading ? "Upload en cours…" : "Image"}
        disabled={imageUploading}
        onClick={onImageClick}
      />

      <Divider />

      <ToolbarButton
        icon={Newspaper}
        label="Citation presse"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "press-quote",
              attrs: {
                quote: "",
                author: "",
                outlet: "",
                outlet_logo_url: null,
              },
            })
            .run()
        }
      />
      <ToolbarButton
        icon={ImagePlus}
        label="Galerie terroir"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "gallery-terroir",
              attrs: { items: [] },
            })
            .run()
        }
      />
      <ToolbarButton
        icon={Package}
        label="Embed produit"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "product-embed",
              attrs: {
                product_id: "",
                product_handle: "",
                product_title: "",
                product_thumbnail: null,
              },
            })
            .run()
        }
      />
      <ToolbarButton
        icon={Lightbulb}
        label="Encadré (callout)"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "callout",
              attrs: { tone: "info", title: "" },
              content: [{ type: "paragraph" }],
            })
            .run()
        }
      />
      <ToolbarButton
        icon={ChefHat}
        label="Étape de recette"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "recipe-step",
              attrs: { step_number: 1, duration_min: null },
              content: [{ type: "paragraph" }],
            })
            .run()
        }
      />

      <Divider />

      <ToolbarButton
        icon={Undo2}
        label="Annuler"
        shortcut={`${mod}+Z`}
        disabled={!editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo2}
        label="Rétablir"
        shortcut={`${mod}+${shift}+Z`}
        disabled={!editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  )
}
