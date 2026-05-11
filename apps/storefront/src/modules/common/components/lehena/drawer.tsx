"use client"

import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react"
import { cn } from "@lib/util/cn"
import { Fragment } from "react"

import { LhClose } from "./icons"

import type { ReactNode } from "react"

type DrawerSide = "right" | "left"

interface LehenaDrawerProps {
  open: boolean
  onClose: () => void
  side?: DrawerSide
  title?: ReactNode
  description?: ReactNode
  /** Hides the default header (title + close). The panel still has aria-modal. */
  hideHeader?: boolean
  /** Tailwind width class. Default `w-[min(460px,100vw)]`. */
  widthClassName?: string
  children: ReactNode
  panelClassName?: string
}

export function LehenaDrawer({
  open,
  onClose,
  side = "right",
  title,
  description,
  hideHeader,
  widthClassName = "w-[min(460px,100vw)]",
  children,
  panelClassName,
}: LehenaDrawerProps) {
  const fromX = side === "right" ? "translate-x-full" : "-translate-x-full"
  const panelPosition = side === "right" ? "right-0" : "left-0"

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[100]">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            aria-hidden
            className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]"
          />
        </TransitionChild>
        <div className="fixed inset-0 overflow-hidden">
          <TransitionChild
            as={Fragment}
            enter="transition-transform duration-[360ms] ease-[cubic-bezier(0.32,0.72,0.2,1)]"
            enterFrom={fromX}
            enterTo="translate-x-0"
            leave="transition-transform duration-[240ms] ease-[cubic-bezier(0.32,0.72,0.2,1)]"
            leaveFrom="translate-x-0"
            leaveTo={fromX}
          >
            <DialogPanel
              className={cn(
                "fixed top-0 h-full bg-creme flex flex-col shadow-2xl",
                panelPosition,
                widthClassName,
                panelClassName
              )}
            >
              {!hideHeader && (
                <header className="flex items-center justify-between border-b border-line px-5 py-4">
                  <div>
                    {title ? (
                      <DialogTitle className="font-display text-step-2 text-ink">
                        {title}
                      </DialogTitle>
                    ) : null}
                    {description ? (
                      <Description className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute">
                        {description}
                      </Description>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="grid place-items-center h-9 w-9 rounded-circle text-ink hover:bg-ink/5 transition-colors"
                  >
                    <LhClose size={20} />
                  </button>
                </header>
              )}
              <div className="flex-1 overflow-y-auto">{children}</div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
