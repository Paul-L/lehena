import * as React from "react"

import type { FieldValues, UseFormReturn } from "react-hook-form"

export type AutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error"

export interface UseAutoSaveOptions<T extends FieldValues> {
  form: UseFormReturn<T>
  /**
   * Persists the latest form values. Should resolve on success and reject
   * on failure; the hook will surface the appropriate status.
   */
  save: (values: T) => Promise<void>
  /** Debounce in ms before triggering a save after the last change. */
  delayMs?: number
  /**
   * When false, the hook is inert (doesn't subscribe to form changes).
   * Useful for the create-page flow before the page exists server-side.
   */
  enabled?: boolean
}

export interface UseAutoSaveReturn {
  status: AutoSaveStatus
  lastSavedAt: number | null
  errorMessage: string | null
  /** Manually flush any pending change without waiting for the debounce. */
  flush: () => Promise<void>
}

const DEFAULT_DELAY = 30_000

export function useAutoSave<T extends FieldValues>({
  form,
  save,
  delayMs = DEFAULT_DELAY,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = React.useState<AutoSaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = React.useRef(false)
  const saveRef = React.useRef(save)
  React.useEffect(() => {
    saveRef.current = save
  }, [save])

  const runSave = React.useCallback(async () => {
    // Prevent overlapping saves; if one is in flight, the next change will
    // re-arm the timer anyway.
    if (inFlightRef.current) return
    if (!form.formState.isDirty) return
    const ok = await form.trigger()
    if (!ok) {
      // Don't auto-save invalid data; surface a soft error and try again
      // on the next change.
      setStatus("error")
      setErrorMessage("Champs invalides — corrigez avant l'enregistrement.")
      return
    }
    inFlightRef.current = true
    setStatus("saving")
    setErrorMessage(null)
    try {
      await saveRef.current(form.getValues())
      setStatus("saved")
      setLastSavedAt(Date.now())
    } catch (err) {
      setStatus("error")
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur d'enregistrement"
      )
    } finally {
      inFlightRef.current = false
    }
  }, [form])

  // Subscribe to form changes; reset the timer on each change.
  React.useEffect(() => {
    if (!enabled) return
    const subscription = form.watch(() => {
      if (!form.formState.isDirty) return
      setStatus("dirty")
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        runSave()
      }, delayMs)
    })
    return () => {
      subscription.unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, form, delayMs, runSave])

  // Confirm before navigating away with unsaved changes.
  React.useEffect(() => {
    if (!enabled) return
    const handler = (e: BeforeUnloadEvent) => {
      if (status === "dirty" || status === "saving") {
        e.preventDefault()
        // Required by Chrome to actually show the dialog.
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [enabled, status])

  const flush = React.useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    await runSave()
  }, [runSave])

  return { status, lastSavedAt, errorMessage, flush }
}
