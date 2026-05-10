"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

type PreviewBannerProps = {
  isDraft: boolean
}

export function PreviewBanner({ isDraft }: PreviewBannerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const exitPreview = () => {
    const next = new URLSearchParams(searchParams?.toString() ?? "")
    next.delete("preview")
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-50 border-b border-yellow-400 bg-yellow-50 text-yellow-900 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">🔍</span>
          <span className="font-medium">Mode preview</span>
          <span className="hidden sm:inline text-yellow-800">
            {isDraft
              ? "— cette page est un brouillon non visible publiquement"
              : "— cette page est publiée, vous voyez la version live"}
          </span>
        </div>
        <button
          type="button"
          onClick={exitPreview}
          className="rounded-md border border-yellow-500 bg-white/60 hover:bg-white px-3 py-1 text-xs font-medium text-yellow-900 transition"
        >
          Quitter le preview
        </button>
      </div>
    </div>
  )
}
