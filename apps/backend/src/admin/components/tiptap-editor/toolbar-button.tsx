import * as React from "react"
import { IconButton, Tooltip, clx } from "@medusajs/ui"

export type ToolbarButtonProps = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
  isActive?: boolean
  disabled?: boolean
  /**
   * Optional — when used as a Popover.Trigger via asChild, leave it undefined
   * so Radix can attach the open handler.
   */
  onClick?: () => void
}

export const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(
  (
    { icon: Icon, label, shortcut, isActive, disabled, onClick, ...rest },
    ref
  ) => {
    const tooltipContent = shortcut ? `${label} (${shortcut})` : label

    return (
      <Tooltip content={tooltipContent} delayDuration={300}>
        <IconButton
          {...rest}
          ref={ref}
          type="button"
          size="small"
          variant="transparent"
          aria-label={label}
          aria-pressed={isActive ?? false}
          disabled={disabled}
          onClick={onClick}
          onMouseDown={(e) => e.preventDefault()}
          className={clx({
            "bg-ui-bg-base-pressed text-ui-fg-base": isActive,
          })}
        >
          <Icon className="h-4 w-4" />
        </IconButton>
      </Tooltip>
    )
  }
)

ToolbarButton.displayName = "ToolbarButton"
