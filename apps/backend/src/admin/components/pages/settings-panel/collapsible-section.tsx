import * as React from "react"
import { clx, Text } from "@medusajs/ui"
import { ChevronDown } from "lucide-react"

type CollapsibleSectionProps = {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <div className="rounded-md border border-ui-border-base bg-ui-bg-base">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ui-bg-base-hover rounded-t-md"
        aria-expanded={open}
      >
        <Text size="small" weight="plus">
          {title}
        </Text>
        <ChevronDown
          className={clx(
            "h-4 w-4 text-ui-fg-subtle transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-ui-border-base flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
