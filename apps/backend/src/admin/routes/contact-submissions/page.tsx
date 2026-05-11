import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Select, Text } from "@medusajs/ui"
import { Mail, RefreshCw } from "lucide-react"
import * as React from "react"

import { sdk } from "../../lib/sdk"

interface Submission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  locale: string
  status: "new" | "read" | "replied" | "spam"
  metadata: Record<string, unknown> | null
  created_at: string
  read_at: string | null
  replied_at: string | null
}

const STATUS_LABEL: Record<Submission["status"], string> = {
  new: "Nouveau",
  read: "Lu",
  replied: "Répondu",
  spam: "Spam",
}

const STATUS_COLOR: Record<
  Submission["status"],
  "green" | "blue" | "grey" | "red"
> = {
  new: "green",
  read: "blue",
  replied: "grey",
  spam: "red",
}

const ALL = "all" as const
type StatusFilter = Submission["status"] | typeof ALL

const PAGE_SIZE = 30

const ContactSubmissionsPage = () => {
  const [status, setStatus] = React.useState<StatusFilter>(ALL)
  const [items, setItems] = React.useState<Submission[]>([])
  const [count, setCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(0)

  const fetchPage = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }
      if (status !== ALL) query.status = status
      const res = await sdk.client.fetch<{
        submissions: Submission[]
        count: number
      }>("/admin/contact-submissions", { query })
      setItems(res.submissions)
      setCount(res.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }, [status, page])

  React.useEffect(() => {
    fetchPage()
  }, [fetchPage])

  const setSubmissionStatus = async (
    id: string,
    next: Submission["status"]
  ) => {
    try {
      await sdk.client.fetch(`/admin/contact-submissions/${id}`, {
        method: "POST",
        body: { status: next },
      })
      setItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: next } : s))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du changement")
    }
  }

  return (
    <Container className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6" />
          <Heading level="h1">Messages contact</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            ({count})
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(0)
              setStatus(v as StatusFilter)
            }}
          >
            <Select.Trigger className="w-44">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={ALL}>Tous les statuts</Select.Item>
              <Select.Item value="new">Nouveaux</Select.Item>
              <Select.Item value="read">Lus</Select.Item>
              <Select.Item value="replied">Répondus</Select.Item>
              <Select.Item value="spam">Spam</Select.Item>
            </Select.Content>
          </Select>
          <Button variant="secondary" size="small" onClick={() => fetchPage()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-ui-border-error bg-ui-bg-error p-3 text-ui-fg-error">
          {error}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <Text className="text-ui-fg-subtle">Chargement…</Text>
      ) : items.length === 0 ? (
        <Text className="text-ui-fg-subtle">Aucun message pour le moment.</Text>
      ) : (
        <ul className="divide-y divide-ui-border-base rounded border border-ui-border-base bg-ui-bg-base">
          {items.map((s) => (
            <li key={s.id} className="p-4">
              <button
                type="button"
                onClick={() => setExpanded((e) => (e === s.id ? null : s.id))}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge color={STATUS_COLOR[s.status]} size="2xsmall">
                      {STATUS_LABEL[s.status]}
                    </Badge>
                    <Text className="font-medium truncate">{s.subject}</Text>
                  </div>
                  <Text size="small" className="text-ui-fg-subtle">
                    {s.name} · {s.email} ·{" "}
                    {new Date(s.created_at).toLocaleString("fr-FR")}
                  </Text>
                </div>
              </button>
              {expanded === s.id ? (
                <div className="mt-3 grid gap-3 rounded bg-ui-bg-subtle p-3">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {s.message}
                  </pre>
                  <div className="flex items-center gap-2">
                    {s.status !== "replied" ? (
                      <Button
                        size="small"
                        onClick={() => setSubmissionStatus(s.id, "replied")}
                      >
                        Marquer comme répondu
                      </Button>
                    ) : null}
                    {s.status !== "spam" ? (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => setSubmissionStatus(s.id, "spam")}
                      >
                        Spam
                      </Button>
                    ) : null}
                    <a
                      href={`mailto:${s.email}?subject=Re:%20${encodeURIComponent(s.subject)}`}
                      className="ml-auto text-sm text-ui-fg-interactive underline"
                    >
                      Répondre par email →
                    </a>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          size="small"
          variant="secondary"
          disabled={page === 0 || loading}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          ← Précédent
        </Button>
        <Text size="small" className="text-ui-fg-subtle">
          Page {page + 1} / {Math.max(1, Math.ceil(count / PAGE_SIZE))}
        </Text>
        <Button
          size="small"
          variant="secondary"
          disabled={(page + 1) * PAGE_SIZE >= count || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Suivant →
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Messages contact",
  icon: Mail,
})

export default ContactSubmissionsPage
