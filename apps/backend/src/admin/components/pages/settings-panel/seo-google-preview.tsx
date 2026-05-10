import * as React from "react"

type SeoGooglePreviewProps = {
  title: string
  description: string
  url: string
}

const STOREFRONT_URL =
  import.meta.env.VITE_STOREFRONT_URL || "https://monsite.com"

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max - 1).trimEnd() + "…" : str

export const SeoGooglePreview: React.FC<SeoGooglePreviewProps> = ({
  title,
  description,
  url,
}) => {
  const fullUrl = `${STOREFRONT_URL.replace(/\/$/, "")}${
    url.startsWith("/") ? url : `/${url}`
  }`

  return (
    <div className="rounded-md border border-ui-border-base bg-ui-bg-base p-3">
      <div className="text-xs text-[#202124] dark:text-ui-fg-base mb-1 font-sans">
        {fullUrl}
      </div>
      <div className="text-base text-[#1a0dab] dark:text-blue-400 font-medium leading-snug">
        {truncate(title || "Titre de la page", 70)}
      </div>
      <div className="text-xs text-[#4d5156] dark:text-ui-fg-subtle leading-relaxed mt-1">
        {truncate(
          description || "Aucune meta description renseignée.",
          160
        )}
      </div>
    </div>
  )
}
