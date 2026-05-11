import { clx } from "@medusajs/ui"
import { useEditor, EditorContent } from "@tiptap/react"
import * as React from "react"

import { EditorBubbleMenu } from "./bubble-menu"
import { getEditorExtensions } from "./extensions"
import { Toolbar } from "./toolbar"

import type { TiptapEditorProps } from "./types"

const EDITOR_CONTENT_CLASS = clx(
  "p-4 min-h-[400px] focus:outline-none",
  // Block styling — descendant selectors so we don't need @tailwindcss/typography
  "[&_p]:my-3 [&_p:first-child]:mt-0",
  "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-ui-fg-base",
  "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-ui-fg-base",
  "[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-ui-fg-base",
  // Empty placeholder via Placeholder extension
  "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
  "[&_p.is-editor-empty:first-child]:before:text-ui-fg-muted",
  "[&_p.is-editor-empty:first-child]:before:float-left",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none",
  "[&_p.is-editor-empty:first-child]:before:h-0"
)

export interface TiptapEditorHandle {
  openLinkPopover?: () => void
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  placeholder,
  editable = true,
  maxCharacters,
  onImageUpload,
  className,
}) => {
  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const onImageUploadRef = React.useRef(onImageUpload)
  React.useEffect(() => {
    onImageUploadRef.current = onImageUpload
  }, [onImageUpload])

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [imageUploading, setImageUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  const insertImageAtCursor = React.useCallback(
    (editor: import("@tiptap/react").Editor, url: string) => {
      editor.chain().focus().setImage({ src: url }).run()
    },
    []
  )

  const editor = useEditor({
    extensions: getEditorExtensions({ placeholder, maxCharacters }),
    content: value ?? "",
    editable,
    editorProps: {
      attributes: {
        class: EDITOR_CONTENT_CLASS,
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false
        const files = Array.from(event.dataTransfer?.files ?? [])
        const images = files.filter((f) => f.type.startsWith("image/"))
        if (!images.length) return false
        const upload = onImageUploadRef.current
        if (!upload) return false

        event.preventDefault()
        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })
        const dropPos = coords?.pos ?? null

        ;(async () => {
          for (const file of images) {
            try {
              setImageUploading(true)
              setUploadError(null)
              const url = await upload(file)
              if (dropPos != null) {
                const node = view.state.schema.nodes.image.create({ src: url })
                view.dispatch(view.state.tr.insert(dropPos, node))
              } else if (editor) {
                insertImageAtCursor(editor, url)
              }
            } catch (err) {
              setUploadError(
                err instanceof Error ? err.message : "Échec de l'upload"
              )
            } finally {
              setImageUploading(false)
            }
          }
        })()

        return true
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items ?? [])
        const imageItems = items.filter((it) => it.type.startsWith("image/"))
        if (!imageItems.length) return false
        const upload = onImageUploadRef.current
        if (!upload) return false

        event.preventDefault()
        ;(async () => {
          for (const item of imageItems) {
            const file = item.getAsFile()
            if (!file) continue
            try {
              setImageUploading(true)
              setUploadError(null)
              const url = await upload(file)
              if (editor) insertImageAtCursor(editor, url)
            } catch (err) {
              setUploadError(
                err instanceof Error ? err.message : "Échec de l'upload"
              )
            } finally {
              setImageUploading(false)
            }
          }
        })()

        return true
      },
    },
    onUpdate({ editor }) {
      onChangeRef.current(editor.getJSON())
    },
  })

  React.useEffect(() => {
    if (!editor) return
    const current = editor.getJSON()
    if (JSON.stringify(value) === JSON.stringify(current)) return
    editor.commands.setContent(value ?? "", { emitUpdate: false })
  }, [editor, value])

  React.useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  const handleImageButtonClick = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ""
      if (!file || !onImageUploadRef.current || !editor) return
      try {
        setImageUploading(true)
        setUploadError(null)
        const url = await onImageUploadRef.current(file)
        insertImageAtCursor(editor, url)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Échec de l'upload")
      } finally {
        setImageUploading(false)
      }
    },
    [editor, insertImageAtCursor]
  )

  const characterCount: number =
    editor?.storage.characterCount?.characters() ?? 0
  const overLimit =
    typeof maxCharacters === "number" && characterCount > maxCharacters

  return (
    <div
      className={clx(
        "border border-ui-border-base rounded-lg overflow-hidden bg-ui-bg-base flex flex-col",
        className
      )}
    >
      {editable && editor && (
        <Toolbar
          editor={editor}
          onImageClick={handleImageButtonClick}
          imageUploading={imageUploading}
        />
      )}

      {editable && editor && <EditorBubbleMenu editor={editor} />}

      <EditorContent editor={editor} />

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
      )}

      {editable && (
        <div
          className={clx(
            "border-t border-ui-border-base bg-ui-bg-subtle px-4 py-2 text-xs text-right flex items-center justify-end gap-3",
            overLimit ? "text-ui-fg-error" : "text-ui-fg-subtle"
          )}
        >
          {uploadError && (
            <span className="text-ui-fg-error">{uploadError}</span>
          )}
          <span>
            {typeof maxCharacters === "number"
              ? `${characterCount} / ${maxCharacters}`
              : `${characterCount} caractère${characterCount !== 1 ? "s" : ""}`}
          </span>
        </div>
      )}
    </div>
  )
}
