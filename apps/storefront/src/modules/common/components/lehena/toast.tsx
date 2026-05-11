"use client"

import { cn } from "@lib/util/cn"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import { LhCheck, LhClose } from "./icons"

import type { ReactNode } from "react"

type ToastTone = "neutral" | "success" | "error"

interface ToastItem {
  id: string
  message: ReactNode
  tone: ToastTone
}

interface ToastContextValue {
  push: (
    message: ReactNode,
    opts?: { tone?: ToastTone; durationMs?: number }
  ) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>")
  }
  return ctx
}

const toneClasses: Record<ToastTone, string> = {
  neutral: "border-line-strong bg-creme text-ink",
  success: "border-rouge bg-creme text-ink",
  error: "border-rouge-deep bg-rouge text-white",
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback<ToastContextValue["push"]>(
    (message, opts) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const tone: ToastTone = opts?.tone ?? "neutral"
      const duration = opts?.durationMs ?? 4000
      setItems((prev) => [...prev, { id, message, tone }])
      window.setTimeout(() => {
        remove(id)
      }, duration)
    },
    [remove]
  )

  const value = useMemo<ToastContextValue>(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed top-6 right-6 z-[120] flex flex-col gap-3 max-w-sm"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 border rounded-large px-4 py-3 shadow-xl animate-fade-in-top",
              toneClasses[t.tone]
            )}
          >
            {t.tone === "success" ? (
              <span aria-hidden className="mt-0.5 text-rouge">
                <LhCheck size={16} />
              </span>
            ) : null}
            <div className="flex-1 text-step-0 font-sans">{t.message}</div>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Fermer la notification"
              className="grid place-items-center h-6 w-6 rounded-circle text-current hover:opacity-70 transition-opacity"
            >
              <LhClose size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
