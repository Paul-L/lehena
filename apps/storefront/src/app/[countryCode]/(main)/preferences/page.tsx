import UnsubscribePanel from "@modules/account/components/unsubscribe-panel"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Préférences de communication — Lehena",
  robots: { index: false, follow: false },
}

export default async function PreferencesPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <article
      className="lh-wrap"
      style={{ padding: "clamp(48px, 8vw, 96px) 0", maxWidth: 640 }}
    >
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Communications
      </div>
      <h1
        className="serif-display"
        style={{ fontSize: "clamp(32px, 4vw, 44px)", marginBottom: 24 }}
      >
        Préférences de communication.
      </h1>
      <UnsubscribePanel token={token ?? ""} />
    </article>
  )
}
