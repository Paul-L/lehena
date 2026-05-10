import * as React from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Label, Select, Text } from "@medusajs/ui"
import { CollapsibleSection } from "./collapsible-section"
import type { PageFormValues } from "../page-form-schema"

const COMMON_LOCALES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
] as const

export const LocaleSection: React.FC = () => {
  const { control } = useFormContext<PageFormValues>()

  return (
    <CollapsibleSection title="Localisation">
      <div className="flex flex-col gap-2">
        <Label size="small" weight="plus">
          Langue
        </Label>
        <Controller
          control={control}
          name="locale"
          render={({ field }) => (
            <Select
              size="small"
              value={field.value}
              onValueChange={field.onChange}
            >
              <Select.Trigger>
                <Select.Value placeholder="Choisir une langue" />
              </Select.Trigger>
              <Select.Content>
                {COMMON_LOCALES.map((l) => (
                  <Select.Item key={l.code} value={l.code}>
                    {l.label} ({l.code.toUpperCase()})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          )}
        />
        <Text size="small" className="text-ui-fg-subtle">
          Les traductions liées (translation_group_id) seront branchées dans une
          itération ultérieure.
        </Text>
      </div>
    </CollapsibleSection>
  )
}
