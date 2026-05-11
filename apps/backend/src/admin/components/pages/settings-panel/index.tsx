import * as React from "react"

import { LocaleSection } from "./locale-section"
import { SeoSection } from "./seo-section"
import { StatusSection } from "./status-section"

import type { Page } from "../../../hooks/use-pages"

interface SettingsPanelProps {
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
