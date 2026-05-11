import CharacterCount from "@tiptap/extension-character-count"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import StarterKit from "@tiptap/starter-kit"

import type { Extensions } from "@tiptap/react"

export interface GetEditorExtensionsOptions {
  placeholder?: string
  maxCharacters?: number
}

export const getEditorExtensions = ({
  placeholder = "Commencez à écrire…",
  maxCharacters,
}: GetEditorExtensionsOptions = {}): Extensions => [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    codeBlock: {
      HTMLAttributes: {
        class:
          "rounded-md bg-ui-bg-subtle p-3 font-mono text-xs text-ui-fg-base overflow-x-auto",
      },
    },
    horizontalRule: {
      HTMLAttributes: { class: "my-6 border-t border-ui-border-base" },
    },
    bulletList: {
      HTMLAttributes: { class: "list-disc pl-6 my-3" },
    },
    orderedList: {
      HTMLAttributes: { class: "list-decimal pl-6 my-3" },
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-ui-border-base pl-4 italic text-ui-fg-subtle",
      },
    },
    link: false,
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: {
      class: "text-ui-fg-interactive underline",
      rel: "noopener noreferrer",
      target: "_blank",
    },
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
    HTMLAttributes: {
      class: "rounded-lg max-w-full h-auto my-4",
    },
  }),
  Typography,
  Placeholder.configure({
    placeholder,
    emptyEditorClass: "is-editor-empty",
  }),
  typeof maxCharacters === "number"
    ? CharacterCount.configure({ limit: maxCharacters })
    : CharacterCount,
]
