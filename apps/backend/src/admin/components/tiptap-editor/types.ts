import type { JSONContent } from "@tiptap/react"

export type { JSONContent }

export interface TiptapEditorProps {
  value: JSONContent | null
  onChange: (value: JSONContent) => void
  placeholder?: string
  editable?: boolean
  maxCharacters?: number
  /**
   * Called when the user adds an image (via toolbar, drag-and-drop, or paste).
   * Must resolve with the URL of the hosted asset; the editor inserts it
   * at the cursor position.
   */
  onImageUpload?: (file: File) => Promise<string>
  className?: string
}
