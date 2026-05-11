import { Button, clx, Input, Label, Text, Textarea, toast } from "@medusajs/ui"
import { Trash2, Upload } from "lucide-react"
import * as React from "react"
import { Controller, useFormContext } from "react-hook-form"

import { uploadImageToMedusa } from "../../tiptap-editor/upload"

import { CollapsibleSection } from "./collapsible-section"
import { SeoGooglePreview } from "./seo-google-preview"

import type { PageFormValues } from "../page-form-schema"

const META_TITLE_MAX = 70
const META_DESCRIPTION_MAX = 160

interface CharCounterProps {
  current: number
  max: number
  ideal?: string
}

const CharCounter: React.FC<CharCounterProps> = ({ current, max, ideal }) => (
  <div className="flex items-center justify-between text-xs">
    {ideal ? (
      <Text size="small" className="text-ui-fg-muted">
        {ideal}
      </Text>
    ) : (
      <span />
    )}
    <Text
      size="small"
      className={clx(current > max ? "text-ui-fg-error" : "text-ui-fg-muted")}
    >
      {current} / {max}
    </Text>
  </div>
)

export const SeoSection: React.FC = () => {
  const { control, watch, setValue } = useFormContext<PageFormValues>()
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = React.useState(false)

  const metaTitle = watch("meta_title") ?? ""
  const metaDescription = watch("meta_description") ?? ""
  const ogImageUrl = watch("og_image_url")
  const slug = watch("slug")
  const fallbackTitle = watch("title")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      setUploading(true)
      const url = await uploadImageToMedusa(file)
      setValue("og_image_url", url, { shouldDirty: true, shouldValidate: true })
      toast.success("Image OG uploadée")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <CollapsibleSection title="SEO">
      <div className="flex flex-col gap-2">
        <Label size="small" weight="plus" htmlFor="seo-meta-title">
          Meta title
        </Label>
        <Controller
          control={control}
          name="meta_title"
          render={({ field }) => (
            <Input
              id="seo-meta-title"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              placeholder={fallbackTitle || "Titre affiché dans Google"}
              maxLength={META_TITLE_MAX + 1}
            />
          )}
        />
        <CharCounter
          current={metaTitle.length}
          max={META_TITLE_MAX}
          ideal="60–70 chars idéal"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label size="small" weight="plus" htmlFor="seo-meta-description">
          Meta description
        </Label>
        <Controller
          control={control}
          name="meta_description"
          render={({ field }) => (
            <Textarea
              id="seo-meta-description"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              placeholder="Description affichée dans les résultats de recherche"
              rows={3}
              maxLength={META_DESCRIPTION_MAX + 1}
            />
          )}
        />
        <CharCounter
          current={metaDescription.length}
          max={META_DESCRIPTION_MAX}
          ideal="150–160 chars idéal"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label size="small" weight="plus">
          Image Open Graph
        </Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {ogImageUrl ? (
          <div className="relative rounded-md border border-ui-border-base overflow-hidden">
            <img
              src={ogImageUrl}
              alt="OG preview"
              className="w-full h-auto max-h-40 object-cover"
            />
            <Button
              type="button"
              size="small"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() =>
                setValue("og_image_url", null, { shouldDirty: true })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="small"
            variant="secondary"
            disabled={uploading}
            isLoading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Choisir une image
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Label size="small" weight="plus">
          Aperçu Google
        </Label>
        <SeoGooglePreview
          title={metaTitle || fallbackTitle || ""}
          description={metaDescription}
          url={`/${slug || ""}`}
        />
      </div>
    </CollapsibleSection>
  )
}
