import * as React from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { Sparkles } from "lucide-react"
import { TiptapEditor } from "../../components/tiptap-editor"
import { uploadImageToMedusa } from "../../components/tiptap-editor/upload"
import type { JSONContent } from "../../components/tiptap-editor"

const INITIAL_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Bienvenue dans le playground TipTap. Sélectionne du texte pour voir le bubble menu, utilise la toolbar pour formater, ou colle/drag&drop une image.",
        },
      ],
    },
  ],
}

/**
 * Temporary route for visually validating the <TiptapEditor /> in isolation.
 * Will be deleted at the end of passe 04 (when the editor is wired into the
 * real /app/pages form).
 */
const TiptapPlaygroundPage = () => {
  const [value, setValue] = React.useState<JSONContent>(INITIAL_CONTENT)
  const [maxChars, setMaxChars] = React.useState<number | undefined>(undefined)

  const reset = React.useCallback(() => {
    setValue(INITIAL_CONTENT)
  }, [])

  const clear = React.useCallback(() => {
    setValue({ type: "doc", content: [{ type: "paragraph" }] })
  }, [])

  return (
    <Container className="p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">Tiptap Playground</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Page temporaire pour valider visuellement l'éditeur. Sera retirée
            quand l'éditeur sera intégré au formulaire des pages éditoriales
            (passe 04).
          </Text>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="small" variant="secondary" onClick={reset}>
            Reset
          </Button>
          <Button size="small" variant="secondary" onClick={clear}>
            Clear
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() =>
              setMaxChars((v) => (typeof v === "number" ? undefined : 500))
            }
          >
            {typeof maxChars === "number"
              ? "Disable max chars"
              : "Set max 500 chars"}
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <Text size="small" weight="plus">
          Éditeur (mode édition)
        </Text>
        <TiptapEditor
          value={value}
          onChange={setValue}
          placeholder="Commencez à écrire…"
          maxCharacters={maxChars}
          onImageUpload={uploadImageToMedusa}
        />
      </section>

      <section className="flex flex-col gap-2">
        <Text size="small" weight="plus">
          JSON courant (live)
        </Text>
        <pre className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3 text-xs overflow-auto max-h-72 text-ui-fg-base">
          {JSON.stringify(value, null, 2)}
        </pre>
      </section>

      <section className="flex flex-col gap-2">
        <Text size="small" weight="plus">
          Rendu read-only (deuxième éditeur, editable=false)
        </Text>
        <TiptapEditor
          value={value}
          onChange={() => {
            /* noop in read-only */
          }}
          editable={false}
        />
      </section>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Tiptap Playground",
  icon: Sparkles,
})

export default TiptapPlaygroundPage
