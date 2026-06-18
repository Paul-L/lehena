import GdprPanel from "@modules/account/components/gdpr-panel"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mes données (RGPD) — Lehena",
  robots: { index: false, follow: false },
}

export default function GdprPage() {
  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="lh-h-page">Mes données (RGPD)</h1>
        <p className="text-sm text-ui-fg-subtle max-w-2xl">
          Vous pouvez à tout moment exporter une copie de vos données
          personnelles, ou demander la suppression définitive de votre compte.
        </p>
      </div>
      <GdprPanel />
    </div>
  )
}
