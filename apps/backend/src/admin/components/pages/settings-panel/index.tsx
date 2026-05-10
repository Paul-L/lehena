import * as React from "react"
import { StatusSection } from "./status-section"
import { SeoSection } from "./seo-section"
import { LocaleSection } from "./locale-section"
import type { Page } from "../../../hooks/use-pages"

type SettingsPanelProps = {
  page: Page | null
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ page }) => {
  return (
    <div className="flex flex-col gap-3 sticky top-6">
      <StatusSection page={page} />
      <SeoSection />
      <LocaleSection />
    </div>
  )
}
