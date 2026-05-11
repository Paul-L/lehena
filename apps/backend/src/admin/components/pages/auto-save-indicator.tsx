import { clx, Text } from "@medusajs/ui"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Check, CircleAlert, CloudUpload, Loader2 } from "lucide-react"
import * as React from "react"

import type { AutoSaveStatus } from "../../hooks/use-auto-save"

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus
  lastSavedAt: number | null
  errorMessage: string | null
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSavedAt,
  errorMessage,
}) => {
  // Tick every 10s so the relative timestamp stays fresh without spam.
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    if (status !== "saved" || !lastSavedAt) return
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [status, lastSavedAt])

  const content = (() => {
    switch (status) {
      case "saving":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          text: "Enregistrement…",
          className: "text-ui-fg-subtle",
        }
      case "dirty":
        return {
          icon: <CloudUpload className="h-3.5 w-3.5" />,
          text: "Modifications non enregistrées",
          className: "text-ui-fg-subtle",
        }
      case "saved":
        return {
          icon: <Check className="h-3.5 w-3.5 text-ui-tag-green-icon" />,
          text: lastSavedAt
            ? `Enregistré ${formatDistanceToNow(new Date(lastSavedAt), {
                addSuffix: true,
                locale: fr,
              })}`
            : "Enregistré",
          className: "text-ui-fg-subtle",
        }
      case "error":
        return {
          icon: <CircleAlert className="h-3.5 w-3.5" />,
          text: errorMessage || "Erreur d'enregistrement",
          className: "text-ui-fg-error",
        }
      case "idle":
      default:
        return null
    }
  })()

  if (!content) return null

  return (
    <div
      className={clx("flex items-center gap-1.5 text-xs", content.className)}
    >
      {content.icon}
      <Text size="small" className={content.className}>
        {content.text}
      </Text>
    </div>
  )
}
