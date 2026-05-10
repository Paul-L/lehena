import * as React from "react"
import { Badge } from "@medusajs/ui"
import type { PageStatus } from "../../hooks/use-pages"

const LABELS: Record<PageStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
}

const COLORS: Record<PageStatus, "grey" | "green"> = {
  draft: "grey",
  published: "green",
}

export const StatusBadge: React.FC<{ status: PageStatus }> = ({ status }) => (
  <Badge color={COLORS[status]} size="2xsmall">
    {LABELS[status]}
  </Badge>
)
