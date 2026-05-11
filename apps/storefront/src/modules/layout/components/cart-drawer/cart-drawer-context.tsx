"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

interface CartDrawerCtx {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  count: number
  justAddedKey: string | null
  flagJustAdded: (key: string) => void
}

const Ctx = createContext<CartDrawerCtx | null>(null)

export function CartDrawerProvider({
  count,
  children,
}: {
  count: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevCount = useRef(count)

  const flagJustAdded = useCallback((key: string) => {
    setJustAddedKey(key)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setJustAddedKey(null), 1600)
  }, [])

  useEffect(() => {
    if (count > prevCount.current) {
      setOpen(true)
    }
    prevCount.current = count
  }, [count])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const value = useMemo<CartDrawerCtx>(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((o) => !o),
      count,
      justAddedKey,
      flagJustAdded,
    }),
    [open, count, justAddedKey, flagJustAdded]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCartDrawer() {
  const v = useContext(Ctx)
  if (!v) {
    return {
      open: false,
      setOpen: () => {},
      toggle: () => {},
      count: 0,
      justAddedKey: null,
      flagJustAdded: () => {},
    } satisfies CartDrawerCtx
  }
  return v
}
