"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { cn } from "@lib/util/cn"
import { LhArrow } from "@modules/common/components/lehena/icons"
import { useParams, useRouter } from "next/navigation"
import { Fragment, useCallback, useMemo } from "react"

type LangCode = "fr" | "es" | "en"

interface LangOption {
  code: LangCode
  label: string
  longLabel: string
  status: "active" | "soon"
}

const OPTIONS: LangOption[] = [
  { code: "fr", label: "FR", longLabel: "Français", status: "active" },
  { code: "es", label: "ES", longLabel: "Español", status: "soon" },
  { code: "en", label: "EN", longLabel: "English", status: "soon" },
]

interface LehenaLanguageSwitcherProps {
  /** Tone variant: `header` (compact light), `menu` (mobile menu row). */
  variant?: "header" | "menu"
}

export function LehenaLanguageSwitcher({
  variant = "header",
}: LehenaLanguageSwitcherProps) {
  const router = useRouter()
  const params = useParams<{ countryCode?: string }>()

  const current = useMemo(() => OPTIONS[0], [])

  const onChange = useCallback(
    (next: LangOption) => {
      if (next.code === current.code) return
      if (next.status === "active") {
        router.refresh()
        return
      }
      const country = params?.countryCode ?? "fr"
      router.push(`/${country}/coming-soon?lang=${next.code}`)
    },
    [current.code, router, params?.countryCode]
  )

  if (variant === "menu") {
    return (
      <div className="flex items-center gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.code}
            type="button"
            onClick={() => onChange(o)}
            aria-label={`Changer la langue : ${o.longLabel}`}
            className={cn(
              "px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] rounded-circle border transition-colors",
              o.code === current.code
                ? "bg-ink text-creme border-ink"
                : "border-line-strong text-ink-soft hover:bg-ink/5"
            )}
          >
            {o.label}
            {o.status === "soon" && (
              <span className="ml-1 text-[8px] opacity-70">·</span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <Listbox value={current} onChange={onChange}>
      <div className="relative">
        <ListboxButton
          aria-label="Sélecteur de langue"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink hover:text-rouge transition-colors"
        >
          {current.label}
          <span aria-hidden className="rotate-90 inline-flex">
            <LhArrow size={11} />
          </span>
        </ListboxButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute right-0 top-full mt-2 min-w-[160px] bg-creme border border-line shadow-lg rounded-rounded py-1 z-50 focus:outline-none">
            {OPTIONS.map((o) => (
              <ListboxOption
                key={o.code}
                value={o}
                className={({ focus }) =>
                  cn(
                    "px-3 py-2 cursor-pointer flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em]",
                    focus ? "bg-ink/5" : ""
                  )
                }
              >
                <span
                  className={cn(
                    o.code === current.code ? "text-rouge" : "text-ink"
                  )}
                >
                  {o.longLabel}
                </span>
                {o.status === "soon" && (
                  <span className="text-[9px] text-ink-mute normal-case tracking-normal">
                    bientôt
                  </span>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  )
}
