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

type ModalSize = "sm" | "md" | "lg"

interface LehenaModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  size?: ModalSize
  children: ReactNode
  /** Hides the default header. */
  hideHeader?: boolean
  /** Optional footer slot (typically action buttons). */
  footer?: ReactNode
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
}

export function LehenaModal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  hideHeader,
  footer,
}: LehenaModalProps) {
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
          <div aria-hidden className="fixed inset-0 bg-ink/55" />
        </TransitionChild>
        <div className="fixed inset-0 grid place-items-center p-4 overflow-y-auto">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={cn(
                "w-full bg-creme rounded-large shadow-2xl flex flex-col max-h-[90vh]",
                sizeClasses[size]
              )}
            >
              {!hideHeader && (
                <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                  <div>
                    {title ? (
                      <DialogTitle className="font-display text-step-3 text-ink">
                        {title}
                      </DialogTitle>
                    ) : null}
                    {description ? (
                      <Description className="mt-1 text-step-0 text-ink-soft">
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
              <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
              {footer ? (
                <footer className="border-t border-line px-6 py-4 flex justify-end gap-3 bg-creme-elevated">
                  {footer}
                </footer>
              ) : null}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
