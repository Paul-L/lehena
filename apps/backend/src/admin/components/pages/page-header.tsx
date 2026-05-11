import { ArrowUturnLeft } from "@medusajs/icons"
import { Button, Heading, Text, toast } from "@medusajs/ui"
import { ExternalLink } from "lucide-react"
import * as React from "react"
import { Link } from "react-router-dom"

import {
  useFetchPreviewToken,
  type Page,
  type PageStatus,
} from "../../hooks/use-pages"
import { buildPageStorefrontUrl } from "../../lib/sdk"

import { StatusBadge } from "./status-badge"

interface PageHeaderProps {
  page: Page | null
  draftTitle?: string
  isSaving?: boolean
  isPublishing?: boolean
  isUnpublishing?: boolean
  canSave: boolean
  onSave: () => void
  onPublish: () => void
  onUnpublish: () => void
  /** Optional slot for the auto-save indicator (wired in P4-7). */
  rightSlot?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  page,
  draftTitle,
  isSaving,
  isPublishing,
  isUnpublishing,
  canSave,
  onSave,
  onPublish,
  onUnpublish,
  rightSlot,
}) => {
  const status: PageStatus = page?.status ?? "draft"
  const isPublished = status === "published"
  const displayTitle = page?.title || draftTitle || "Nouvelle page"
  const previewTokenMutation = useFetchPreviewToken()

  const handleViewSite = async () => {
    if (!page) return
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

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-ui-fg-subtle text-xs">
        <Link
          to="/pages"
          className="inline-flex items-center gap-1 hover:text-ui-fg-base"
        >
          <ArrowUturnLeft />
          <span>Pages</span>
        </Link>
        <span>/</span>
        <span className="text-ui-fg-base truncate max-w-md">
          {displayTitle}
        </span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Heading level="h1" className="text-xl">
            Édition de la page
          </Heading>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center gap-2">
          {rightSlot}

          {page && (
            <Button
              size="small"
              variant="secondary"
              isLoading={previewTokenMutation.isPending}
              onClick={handleViewSite}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Voir le site
            </Button>
          )}

          <Button
            size="small"
            variant="secondary"
            disabled={!canSave || isSaving}
            isLoading={isSaving}
            onClick={onSave}
          >
            {isPublished ? "Enregistrer" : "Enregistrer le brouillon"}
          </Button>

          {isPublished ? (
            <Button
              size="small"
              variant="secondary"
              disabled={isUnpublishing}
              isLoading={isUnpublishing}
              onClick={onUnpublish}
            >
              Dépublier
            </Button>
          ) : (
            <Button
              size="small"
              disabled={!canSave || isPublishing}
              isLoading={isPublishing}
              onClick={onPublish}
            >
              Publier
            </Button>
          )}
        </div>
      </div>

      {page?.published_at && (
        <Text size="small" className="text-ui-fg-subtle">
          Publié le{" "}
          {new Date(page.published_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
    </header>
  )
}
