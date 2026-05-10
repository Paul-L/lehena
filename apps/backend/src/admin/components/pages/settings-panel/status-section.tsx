import * as React from "react"
import { Text } from "@medusajs/ui"
import { StatusBadge } from "../status-badge"
import type { Page } from "../../../hooks/use-pages"

type StatusSectionProps = {
  page: Page | null
}

export const StatusSection: React.FC<StatusSectionProps> = ({ page }) => {
  return (
    <div className="rounded-md border border-ui-border-base bg-ui-bg-base p-4 flex flex-col gap-2">
      <Text size="small" weight="plus">
        Statut
      </Text>
      <div className="flex items-center gap-2">
        <StatusBadge status={page?.status ?? "draft"} />
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
      </div>
    </div>
  )
}
