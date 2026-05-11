import { EllipsisHorizontal } from "@medusajs/icons"
import { DropdownMenu, IconButton, toast } from "@medusajs/ui"
import * as React from "react"
import { useNavigate } from "react-router-dom"

import {
  useCreatePage,
  useFetchPreviewToken,
  type Page,
} from "../../hooks/use-pages"
import { buildPageStorefrontUrl, sdk } from "../../lib/sdk"

import { DeletePageModal } from "./delete-page-modal"

/**
 * Builds an unused duplicate slug by trying `${slug}-copie`, then `-copie-2`,
 * `-copie-3`, etc. Probes the admin pages API for collisions.
 */
async function findAvailableDuplicateSlug(baseSlug: string): Promise<string> {
  for (let i = 1; i < 100; i++) {
    const candidate = i === 1 ? `${baseSlug}-copie` : `${baseSlug}-copie-${i}`
    const resp = await sdk.client.fetch<{ pages: { id: string }[] }>(
      "/admin/pages",
      { query: { slug: candidate, limit: 1 } }
    )
    if (resp.pages.length === 0) return candidate
  }
  // Fallback to timestamp suffix if 100 collisions (very unlikely)
  return `${baseSlug}-copie-${Date.now()}`
}

interface PagesRowActionsProps {
  page: Page
}

export const PagesRowActions: React.FC<PagesRowActionsProps> = ({ page }) => {
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const createMutation = useCreatePage()
  const previewTokenMutation = useFetchPreviewToken()

  const handleViewSite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const { token } = await previewTokenMutation.mutateAsync()
      const url = buildPageStorefrontUrl(page.locale, page.slug, token)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer le token de preview"
      )
    }
  }

  const handleDuplicate = async () => {
    try {
      const newSlug = await findAvailableDuplicateSlug(page.slug)
      const created = await createMutation.mutateAsync({
        slug: newSlug,
        title: `${page.title} (copie)`,
        content: page.content,
        excerpt: page.excerpt,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        og_image_url: page.og_image_url,
        locale: page.locale,
      })
      toast.success("Page dupliquée")
      navigate(`/pages/${created.page.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Duplication impossible")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <IconButton
            size="small"
            variant="transparent"
            aria-label="Actions"
            onClick={(e) => e.stopPropagation()}
          >
            <EllipsisHorizontal />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item
            onClick={handleViewSite}
            disabled={previewTokenMutation.isPending}
          >
            Voir sur le site
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={handleDuplicate}
            disabled={createMutation.isPending}
          >
            Dupliquer
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            onClick={() => setDeleteOpen(true)}
            className="text-ui-fg-error"
          >
            Supprimer
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>

      <DeletePageModal
        page={page}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
