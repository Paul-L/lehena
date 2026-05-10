import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  Controller,
  FormProvider,
  useForm,
  type SubmitHandler,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Container, Heading, toast } from "@medusajs/ui"
import { ArrowUturnLeft } from "@medusajs/icons"
import {
  pageFormSchema,
  type PageFormValues,
} from "./page-form-schema"
import { TitleInput } from "./title-input"
import { SlugInput } from "./slug-input"
import { SettingsPanel } from "./settings-panel"
import { AutoSaveIndicator } from "./auto-save-indicator"
import { TiptapEditor } from "../tiptap-editor"
import { uploadImageToMedusa } from "../tiptap-editor/upload"
import { slugify } from "../../lib/slugify"
import {
  useCheckSlugAvailability,
  useCreatePage,
} from "../../hooks/use-pages"
import { useAutoSave } from "../../hooks/use-auto-save"

const EMPTY_VALUES: PageFormValues = {
  title: "",
  slug: "",
  content: null,
  excerpt: null,
  meta_title: null,
  meta_description: null,
  og_image_url: null,
  locale: "fr",
}

export const PageCreateForm: React.FC = () => {
  const navigate = useNavigate()
  const createMutation = useCreatePage()

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onChange",
  })

  // Slug starts unlocked: typing the title generates the slug live.
  const [slugLocked, setSlugLocked] = React.useState(false)

  const title = form.watch("title")
  const currentSlug = form.watch("slug")

  const slugAvailability = useCheckSlugAvailability(currentSlug)
  const slugInvalid =
    !!form.formState.errors.slug ||
    (slugAvailability.data && !slugAvailability.data.available)

  React.useEffect(() => {
    if (slugLocked || !title) return
    const next = slugify(title)
    if (next !== form.getValues("slug")) {
      form.setValue("slug", next, { shouldValidate: true, shouldDirty: true })
    }
  }, [title, slugLocked, form])

  const createAndRedirect = React.useCallback(
    async (values: PageFormValues) => {
      const created = await createMutation.mutateAsync(values)
      // replace: avoid a "back" to the now-orphan /pages/new
      navigate(`/pages/${created.page.id}`, { replace: true })
    },
    [createMutation, navigate]
  )

  // Auto-save only kicks in once the title is filled — otherwise we'd spam
  // the API with empty drafts.
  const titleReady = title.trim().length > 0
  const autoSave = useAutoSave<PageFormValues>({
    form,
    enabled: titleReady,
    save: createAndRedirect,
  })

  const onSubmit: SubmitHandler<PageFormValues> = async (values) => {
    try {
      await createAndRedirect(values)
      toast.success("Page créée")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Création impossible"
      )
    }
  }

  const canSave =
    form.formState.isValid &&
    !slugInvalid &&
    titleReady &&
    !createMutation.isPending

  return (
    <FormProvider {...form}>
      <Container className="p-6 flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-ui-fg-subtle text-xs">
            <Link
              to="/pages"
              className="inline-flex items-center gap-1 hover:text-ui-fg-base"
            >
              <ArrowUturnLeft />
              <span>Pages</span>
            </Link>
            <span>/</span>
            <span className="text-ui-fg-base">Nouvelle page</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <Heading level="h1" className="text-xl">
              Nouvelle page éditoriale
            </Heading>

            <div className="flex items-center gap-2">
              <AutoSaveIndicator
                status={autoSave.status}
                lastSavedAt={autoSave.lastSavedAt}
                errorMessage={autoSave.errorMessage}
              />
              <Button
                size="small"
                disabled={!canSave}
                isLoading={createMutation.isPending}
                onClick={form.handleSubmit(onSubmit)}
              >
                Créer la page
              </Button>
            </div>
          </div>
        </header>

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
                  autoFocus
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
            <SettingsPanel page={null} />
          </aside>

          <button type="submit" className="hidden" />
        </form>
      </Container>
    </FormProvider>
  )
}
