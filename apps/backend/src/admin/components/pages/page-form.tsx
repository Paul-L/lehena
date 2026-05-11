import { zodResolver } from "@hookform/resolvers/zod"
import { Container, toast } from "@medusajs/ui"
import * as React from "react"
import {
  Controller,
  FormProvider,
  useForm,
  type SubmitHandler,
} from "react-hook-form"

import { useAutoSave } from "../../hooks/use-auto-save"
import {
  useCheckSlugAvailability,
  usePublishPage,
  useUnpublishPage,
  useUpdatePage,
  type Page,
} from "../../hooks/use-pages"
import { slugify } from "../../lib/slugify"
import { TiptapEditor } from "../tiptap-editor"
import { uploadImageToMedusa } from "../tiptap-editor/upload"

import { AutoSaveIndicator } from "./auto-save-indicator"
import { pageFormSchema, type PageFormValues } from "./page-form-schema"
import { PageHeader } from "./page-header"
import { SettingsPanel } from "./settings-panel"
import { SlugInput } from "./slug-input"
import { TitleInput } from "./title-input"

interface PageFormProps {
  page: Page
}

const toFormValues = (p: Page): PageFormValues => ({
  title: p.title,
  slug: p.slug,
  content: p.content,
  excerpt: p.excerpt,
  meta_title: p.meta_title,
  meta_description: p.meta_description,
  og_image_url: p.og_image_url,
  locale: p.locale,
})

export const PageForm: React.FC<PageFormProps> = ({ page }) => {
  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: toFormValues(page),
    mode: "onChange",
  })

  // Reset form when the underlying page changes (e.g. after a publish/unpublish
  // mutation refreshes the cache).
  React.useEffect(() => {
    form.reset(toFormValues(page), { keepDirty: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, page.updated_at])

  const updateMutation = useUpdatePage(page.id)
  const publishMutation = usePublishPage(page.id)
  const unpublishMutation = useUnpublishPage(page.id)

  // Lock state for slug auto-generation. Existing pages start locked: we
  // don't want a stray title edit to silently rewrite the slug (and break
  // SEO / inbound links).
  const [slugLocked, setSlugLocked] = React.useState(true)

  const title = form.watch("title")
  const currentSlug = form.watch("slug")

  // Live slug uniqueness check (excluding the current page).
  const slugAvailability = useCheckSlugAvailability(currentSlug, page.id)
  const slugInvalid =
    !!form.formState.errors.slug ||
    (slugAvailability.data && !slugAvailability.data.available)

  // Auto-regenerate slug from title when unlocked.
  React.useEffect(() => {
    if (slugLocked || !title) return
    const next = slugify(title)
    if (next !== form.getValues("slug")) {
      form.setValue("slug", next, { shouldValidate: true, shouldDirty: true })
    }
  }, [title, slugLocked, form])

  const onSubmit: SubmitHandler<PageFormValues> = async (values) => {
    try {
      await updateMutation.mutateAsync(values)
      toast.success("Page enregistrée")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible d'enregistrer la page"
      )
    }
  }

  // Silent auto-save: same payload as the manual onSubmit but no toast on
  // success (the indicator already conveys the state).
  const autoSave = useAutoSave<PageFormValues>({
    form,
    save: async (values) => {
      await updateMutation.mutateAsync(values)
    },
  })

  const handlePublish = async () => {
    const ok = await form.trigger()
    if (!ok || slugInvalid) {
      toast.error("Vérifie les champs en erreur avant de publier.")
      return
    }
    try {
      // Flush any pending auto-save and then save the latest values
      // synchronously before publishing.
      await autoSave.flush()
      if (form.formState.isDirty) {
        await updateMutation.mutateAsync(form.getValues())
      }
      await publishMutation.mutateAsync()
      toast.success("Page publiée")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publication impossible")
    }
  }

  const handleUnpublish = async () => {
    try {
      await unpublishMutation.mutateAsync()
      toast.success("Page dépubliée")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Dépublication impossible"
      )
    }
  }

  const canSave =
    form.formState.isValid && !slugInvalid && !updateMutation.isPending

  return (
    <FormProvider {...form}>
      <Container className="p-6 flex flex-col gap-6">
        <PageHeader
          page={page}
          canSave={canSave}
          isSaving={updateMutation.isPending}
          isPublishing={publishMutation.isPending}
          isUnpublishing={unpublishMutation.isPending}
          onSave={form.handleSubmit(onSubmit)}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          rightSlot={
            <AutoSaveIndicator
              status={autoSave.status}
              lastSavedAt={autoSave.lastSavedAt}
              errorMessage={autoSave.errorMessage}
            />
          }
        />

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <TitleInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="slug"
              render={({ field }) => (
                <SlugInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  locked={slugLocked}
                  onLockChange={setSlugLocked}
                  excludeId={page.id}
                />
              )}
            />

            <Controller
              control={form.control}
              name="content"
              render={({ field }) => (
                <TiptapEditor
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v as Record<string, unknown>)}
                  onImageUpload={uploadImageToMedusa}
                  className="min-h-[600px]"
                />
              )}
            />
          </div>

          <aside className="lg:col-span-1">
            <SettingsPanel page={page} />
          </aside>

          {/* Hidden submit so Cmd+Enter / browser shortcuts work */}
          <button type="submit" className="hidden" />
        </form>
      </Container>
    </FormProvider>
  )
}
