import * as React from "react"
import { Button, Input, Label, Prompt, toast } from "@medusajs/ui"
import { useDeletePage, type Page } from "../../hooks/use-pages"

type DeletePageModalProps = {
  page: Page
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export const DeletePageModal: React.FC<DeletePageModalProps> = ({
  page,
  open,
  onOpenChange,
  onDeleted,
}) => {
  const [confirmation, setConfirmation] = React.useState("")
  const deleteMutation = useDeletePage()

  React.useEffect(() => {
    if (open) setConfirmation("")
  }, [open])

  const matches = confirmation.trim() === page.slug

  const handleDelete = async () => {
    if (!matches) return
    try {
      await deleteMutation.mutateAsync(page.id)
      toast.success("Page supprimée")
      onOpenChange(false)
      onDeleted?.()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Suppression impossible"
      )
    }
  }

  return (
    <Prompt variant="danger" open={open} onOpenChange={onOpenChange}>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Supprimer la page</Prompt.Title>
          <Prompt.Description>
            Cette action peut être annulée (soft-delete). Pour confirmer, retape
            le slug{" "}
            <code className="rounded bg-ui-bg-subtle px-1 text-xs">
              {page.slug}
            </code>{" "}
            ci-dessous.
          </Prompt.Description>
        </Prompt.Header>

        <div className="px-6 pb-2 flex flex-col gap-2">
          <Label size="small" weight="plus" htmlFor="delete-confirm-slug">
            Slug
          </Label>
          <Input
            id="delete-confirm-slug"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={page.slug}
            autoFocus
          />
        </div>

        <Prompt.Footer>
          <Prompt.Cancel asChild>
            <Button variant="secondary" size="small">
              Annuler
            </Button>
          </Prompt.Cancel>
          <Button
            variant="danger"
            size="small"
            disabled={!matches || deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            Supprimer
          </Button>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}
