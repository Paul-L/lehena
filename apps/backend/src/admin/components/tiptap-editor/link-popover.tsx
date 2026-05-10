import * as React from "react"
import type { Editor } from "@tiptap/react"
import { Button, Input, Label, Popover } from "@medusajs/ui"

type LinkPopoverProps = {
  editor: Editor
  children: React.ReactNode
}

export const LinkPopover: React.FC<LinkPopoverProps> = ({
  editor,
  children,
}) => {
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    const previousUrl =
      (editor.getAttributes("link").href as string | undefined) ?? ""
    setUrl(previousUrl)
  }, [open, editor])

  const apply = React.useCallback(() => {
    const trimmed = url.trim()
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: trimmed })
        .run()
    }
    setOpen(false)
  }, [editor, url])

  const remove = React.useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    setOpen(false)
  }, [editor])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-80 p-3 z-50"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            apply()
          }}
          className="flex flex-col gap-2"
        >
          <Label
            size="small"
            weight="plus"
            htmlFor="tiptap-link-url"
          >
            URL
          </Label>
          <Input
            id="tiptap-link-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-1">
            {editor.isActive("link") && (
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={remove}
              >
                Retirer
              </Button>
            )}
            <Button type="submit" size="small">
              Appliquer
            </Button>
          </div>
        </form>
      </Popover.Content>
    </Popover>
  )
}
