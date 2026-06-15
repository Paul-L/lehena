import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
} from "@medusajs/ui"
import { Database, Play, Plug, RefreshCw } from "lucide-react"
import * as React from "react"

import { sdk } from "../../lib/sdk"

interface WcCredentials {
  url: string
  consumer_key: string
  secret_hint: string | null
  validated_at: string | null
}

interface MigrationRun {
  id: string
  script: "products" | "customers" | "media"
  source: "api" | "fixtures"
  dry_run: boolean
  limit: number | null
  status: "pending" | "running" | "completed" | "failed"
  totals: {
    seen: number
    created: number
    updated: number
    skipped: number
    failed: number
  } | null
  entries:
    | {
        legacy_id: number
        outcome: "created" | "updated" | "skipped" | "failed"
        medusa_id?: string
        notes?: string
      }[]
    | null
  error_message: string | null
  workflow_execution_id: string | null
  triggered_by: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

const STATUS_COLOR: Record<
  MigrationRun["status"],
  "grey" | "blue" | "green" | "red" | "orange"
> = {
  pending: "grey",
  running: "blue",
  completed: "green",
  failed: "red",
}

const STATUS_LABEL: Record<MigrationRun["status"], string> = {
  pending: "En attente",
  running: "En cours",
  completed: "Terminé",
  failed: "Échec",
}

const SCRIPT_LABEL: Record<MigrationRun["script"], string> = {
  products: "Produits",
  customers: "Clients",
  media: "Médias",
}

const ALL = "all" as const
const PAGE_SIZE = 20

const MigrationPage = () => {
  const [scriptFilter, setScriptFilter] = React.useState<
    MigrationRun["script"] | typeof ALL
  >(ALL)
  const [runs, setRuns] = React.useState<MigrationRun[]>([])
  const [count, setCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(0)

  // Form state — new run
  const [formScript, setFormScript] =
    React.useState<MigrationRun["script"]>("products")
  const [formSource, setFormSource] =
    React.useState<MigrationRun["source"]>("fixtures")
  const [formCommit, setFormCommit] = React.useState(false)
  const [formLimit, setFormLimit] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)

  // Form state — WC credentials
  const [creds, setCreds] = React.useState<WcCredentials | null>(null)
  const [credsLoading, setCredsLoading] = React.useState(false)
  const [credsEditing, setCredsEditing] = React.useState(false)
  const [credsForm, setCredsForm] = React.useState({
    url: "",
    consumer_key: "",
    consumer_secret: "",
  })
  const [credsSaving, setCredsSaving] = React.useState(false)
  const [credsTesting, setCredsTesting] = React.useState(false)
  const [credsMessage, setCredsMessage] = React.useState<
    { kind: "ok" | "error"; text: string } | null
  >(null)

  const fetchRuns = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }
      if (scriptFilter !== ALL) query.script = scriptFilter
      const res = await sdk.client.fetch<{
        runs: MigrationRun[]
        count: number
      }>("/admin/migration-runs", { query })
      setRuns(res.runs)
      setCount(res.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }, [scriptFilter, page])

  React.useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  const fetchCreds = React.useCallback(async () => {
    setCredsLoading(true)
    try {
      const res = await sdk.client.fetch<{
        credentials: WcCredentials | null
      }>("/admin/migration/wc-credentials")
      setCreds(res.credentials)
      if (res.credentials) {
        setCredsForm({
          url: res.credentials.url,
          consumer_key: res.credentials.consumer_key,
          consumer_secret: "",
        })
      }
    } catch (err) {
      setCredsMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Erreur de chargement",
      })
    } finally {
      setCredsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchCreds()
  }, [fetchCreds])

  const saveCreds = async () => {
    setCredsSaving(true)
    setCredsMessage(null)
    try {
      const res = await sdk.client.fetch<{ credentials: WcCredentials }>(
        "/admin/migration/wc-credentials",
        { method: "POST", body: credsForm }
      )
      setCreds(res.credentials)
      setCredsEditing(false)
      setCredsForm((prev) => ({ ...prev, consumer_secret: "" }))
      setCredsMessage({
        kind: "ok",
        text: "Identifiants enregistrés. Lance un test de connexion pour valider.",
      })
    } catch (err) {
      setCredsMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Échec de l'enregistrement",
      })
    } finally {
      setCredsSaving(false)
    }
  }

  const testCreds = async () => {
    setCredsTesting(true)
    setCredsMessage(null)
    try {
      const res = await sdk.client.fetch<{
        ok: boolean
        status: number
        error?: string
        credentials?: WcCredentials
      }>("/admin/migration/wc-credentials/test", { method: "POST" })
      if (res.ok) {
        if (res.credentials) setCreds(res.credentials)
        setCredsMessage({
          kind: "ok",
          text: `Connexion validée (HTTP ${res.status}).`,
        })
      } else {
        setCredsMessage({
          kind: "error",
          text: res.error ?? `Échec (HTTP ${res.status}).`,
        })
      }
    } catch (err) {
      setCredsMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Échec du test",
      })
    } finally {
      setCredsTesting(false)
    }
  }

  // Auto-refresh while any run is in flight.
  const hasInflight = runs.some(
    (r) => r.status === "running" || r.status === "pending"
  )
  React.useEffect(() => {
    if (!hasInflight) return
    const id = setInterval(() => {
      void fetchRuns()
    }, 3000)
    return () => clearInterval(id)
  }, [hasInflight, fetchRuns])

  const loadRunDetail = async (runId: string) => {
    try {
      const res = await sdk.client.fetch<{ run: MigrationRun }>(
        `/admin/migration-runs/${runId}`
      )
      setRuns((prev) => prev.map((r) => (r.id === runId ? res.run : r)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement")
    }
  }

  const startRun = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        script: formScript,
        source: formSource,
        commit: formCommit,
      }
      const limitNum = parseInt(formLimit, 10)
      if (!Number.isNaN(limitNum) && limitNum > 0) body.limit = limitNum
      await sdk.client.fetch<{ run: MigrationRun }>("/admin/migration-runs", {
        method: "POST",
        body,
      })
      setPage(0)
      await fetchRuns()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du lancement")
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <Container className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Database className="h-6 w-6" />
        <Heading level="h1">Migration WP → Medusa</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          ({count} run{count > 1 ? "s" : ""})
        </Text>
      </div>

      {/* ─── WC credentials ──────────────────────────────────────── */}
      <div className="mb-6 rounded border border-ui-border-base bg-ui-bg-base p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <Text size="small" weight="plus" leading="compact">
              Connexion WooCommerce
            </Text>
            {creds?.validated_at ? (
              <Badge color="green" size="2xsmall">
                Validée
              </Badge>
            ) : creds ? (
              <Badge color="orange" size="2xsmall">
                Non testée
              </Badge>
            ) : (
              <Badge color="grey" size="2xsmall">
                Non configurée
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {creds && !credsEditing ? (
              <Button
                size="small"
                variant="secondary"
                onClick={testCreds}
                isLoading={credsTesting}
                disabled={credsTesting}
              >
                Tester la connexion
              </Button>
            ) : null}
            {!credsEditing ? (
              <Button
                size="small"
                variant="secondary"
                onClick={() => {
                  setCredsEditing(true)
                  setCredsMessage(null)
                }}
              >
                {creds ? "Modifier" : "Configurer"}
              </Button>
            ) : (
              <Button
                size="small"
                variant="transparent"
                onClick={() => {
                  setCredsEditing(false)
                  setCredsMessage(null)
                  if (creds) {
                    setCredsForm({
                      url: creds.url,
                      consumer_key: creds.consumer_key,
                      consumer_secret: "",
                    })
                  }
                }}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>

        {credsLoading ? (
          <Text size="small" className="text-ui-fg-subtle">
            Chargement…
          </Text>
        ) : credsEditing ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <Label size="xsmall" htmlFor="wc-url">
                URL boutique WC
              </Label>
              <Input
                id="wc-url"
                placeholder="https://lehena.fr"
                value={credsForm.url}
                onChange={(e) =>
                  setCredsForm((prev) => ({ ...prev, url: e.target.value }))
                }
              />
            </div>
            <div>
              <Label size="xsmall" htmlFor="wc-key">
                Consumer key
              </Label>
              <Input
                id="wc-key"
                placeholder="ck_…"
                value={credsForm.consumer_key}
                onChange={(e) =>
                  setCredsForm((prev) => ({
                    ...prev,
                    consumer_key: e.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label size="xsmall" htmlFor="wc-secret">
                Consumer secret
              </Label>
              <Input
                id="wc-secret"
                type="password"
                placeholder={
                  creds ? "Laisser vide pour conserver le secret actuel" : "cs_…"
                }
                value={credsForm.consumer_secret}
                onChange={(e) =>
                  setCredsForm((prev) => ({
                    ...prev,
                    consumer_secret: e.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button
                size="small"
                variant="primary"
                onClick={saveCreds}
                isLoading={credsSaving}
                disabled={
                  credsSaving ||
                  !credsForm.url ||
                  !credsForm.consumer_key ||
                  !credsForm.consumer_secret
                }
              >
                Enregistrer
              </Button>
            </div>
          </div>
        ) : creds ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                URL
              </Text>
              <Text size="small">{creds.url}</Text>
            </div>
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Consumer key
              </Text>
              <Text size="small">{creds.consumer_key}</Text>
            </div>
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Secret
              </Text>
              <Text size="small">
                {creds.secret_hint ? `••••${creds.secret_hint}` : "—"}
              </Text>
            </div>
            <div className="md:col-span-3">
              <Text size="xsmall" className="text-ui-fg-subtle">
                {creds.validated_at
                  ? `Dernière validation : ${new Date(
                      creds.validated_at
                    ).toLocaleString("fr-FR")}`
                  : "Jamais testée — lance « Tester la connexion » avant un run live."}
              </Text>
            </div>
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            Aucune credential enregistrée. Configure ci-dessous pour utiliser la
            source « WC REST API live ».
          </Text>
        )}

        {credsMessage ? (
          <div
            className={`mt-3 rounded border p-2 ${
              credsMessage.kind === "ok"
                ? "border-ui-border-base bg-ui-bg-base text-ui-fg-base"
                : "border-ui-border-error bg-ui-bg-base text-ui-fg-error"
            }`}
          >
            <Text size="small">{credsMessage.text}</Text>
          </div>
        ) : null}
      </div>

      {/* ─── New run form ────────────────────────────────────────── */}
      <div className="mb-6 rounded border border-ui-border-base bg-ui-bg-base p-4">
        <Text
          size="small"
          weight="plus"
          leading="compact"
          className="mb-3 block"
        >
          Lancer une nouvelle migration
        </Text>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div>
            <Label size="xsmall" htmlFor="mig-script">
              Script
            </Label>
            <Select
              value={formScript}
              onValueChange={(v) =>
                setFormScript(v as MigrationRun["script"])
              }
            >
              <Select.Trigger id="mig-script">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="products">Produits</Select.Item>
                <Select.Item value="customers">Clients</Select.Item>
                <Select.Item value="media">Médias</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Label size="xsmall" htmlFor="mig-source">
              Source
            </Label>
            <Select
              value={formSource}
              onValueChange={(v) =>
                setFormSource(v as MigrationRun["source"])
              }
            >
              <Select.Trigger id="mig-source">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="fixtures">
                  Fixtures (test local)
                </Select.Item>
                <Select.Item value="api">WC REST API live</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Label size="xsmall" htmlFor="mig-limit">
              Limite (vide = ∞)
            </Label>
            <Input
              id="mig-limit"
              type="number"
              min={1}
              placeholder="∞"
              value={formLimit}
              onChange={(e) => setFormLimit(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label size="xsmall" htmlFor="mig-commit">
              Mode
            </Label>
            <div className="flex h-9 items-center gap-2">
              <Switch
                id="mig-commit"
                checked={formCommit}
                onCheckedChange={setFormCommit}
              />
              <Text size="small" className="text-ui-fg-subtle">
                {formCommit ? "--commit (écrit en DB)" : "dry-run"}
              </Text>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              size="small"
              variant="primary"
              isLoading={submitting}
              disabled={submitting}
              onClick={startRun}
            >
              <Play className="mr-1 h-4 w-4" />
              Lancer
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Filter + refresh ────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between">
        <Select
          value={scriptFilter}
          onValueChange={(v) => {
            setPage(0)
            setScriptFilter(v as typeof scriptFilter)
          }}
        >
          <Select.Trigger className="w-48">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL}>Tous les scripts</Select.Item>
            <Select.Item value="products">Produits</Select.Item>
            <Select.Item value="customers">Clients</Select.Item>
            <Select.Item value="media">Médias</Select.Item>
          </Select.Content>
        </Select>
        <Button variant="secondary" size="small" onClick={() => fetchRuns()}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Rafraîchir
        </Button>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-ui-border-error bg-ui-bg-base p-3 text-ui-fg-error">
          <Text size="small">{error}</Text>
        </div>
      ) : null}

      {/* ─── Runs list ───────────────────────────────────────────── */}
      {loading && runs.length === 0 ? (
        <Text className="text-ui-fg-subtle">Chargement…</Text>
      ) : runs.length === 0 ? (
        <Text className="text-ui-fg-subtle">Aucun run pour le moment.</Text>
      ) : (
        <ul className="divide-y divide-ui-border-base rounded border border-ui-border-base bg-ui-bg-base">
          {runs.map((r) => (
            <li key={r.id} className="p-4">
              <button
                type="button"
                onClick={() => {
                  const next = expanded === r.id ? null : r.id
                  setExpanded(next)
                  if (next) void loadRunDetail(r.id)
                }}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge color={STATUS_COLOR[r.status]} size="2xsmall">
                      {STATUS_LABEL[r.status]}
                    </Badge>
                    <Text size="small" weight="plus">
                      {SCRIPT_LABEL[r.script]}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      · {r.source}
                    </Text>
                    {r.dry_run ? (
                      <Badge color="grey" size="2xsmall">
                        dry-run
                      </Badge>
                    ) : (
                      <Badge color="orange" size="2xsmall">
                        commit
                      </Badge>
                    )}
                  </div>
                  <Text size="small" className="text-ui-fg-subtle">
                    {new Date(r.created_at).toLocaleString("fr-FR")}
                    {r.totals
                      ? ` · seen ${r.totals.seen} · created ${r.totals.created} · skipped ${r.totals.skipped}${
                          r.totals.failed > 0
                            ? ` · failed ${r.totals.failed}`
                            : ""
                        }`
                      : ""}
                  </Text>
                </div>
              </button>

              {expanded === r.id ? (
                <div className="mt-3 grid gap-3 rounded bg-ui-bg-subtle p-3">
                  {r.error_message ? (
                    <div className="rounded border border-ui-border-error bg-ui-bg-base p-2 text-ui-fg-error">
                      <Text size="small">{r.error_message}</Text>
                    </div>
                  ) : null}
                  {r.entries && r.entries.length > 0 ? (
                    <div>
                      <Text
                        size="small"
                        weight="plus"
                        leading="compact"
                        className="mb-2 block"
                      >
                        Entrées ({r.entries.length})
                      </Text>
                      <ul className="max-h-96 divide-y divide-ui-border-base overflow-auto rounded border border-ui-border-base bg-ui-bg-base">
                        {r.entries.map((e, i) => (
                          <li key={`${r.id}-${i}`} className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                color={
                                  e.outcome === "created"
                                    ? "green"
                                    : e.outcome === "updated"
                                      ? "blue"
                                      : e.outcome === "skipped"
                                        ? "grey"
                                        : "red"
                                }
                                size="2xsmall"
                              >
                                {e.outcome}
                              </Badge>
                              <Text size="small">
                                legacy_id={e.legacy_id}
                                {e.medusa_id ? ` → ${e.medusa_id}` : ""}
                              </Text>
                            </div>
                            {e.notes ? (
                              <Text
                                size="small"
                                className="text-ui-fg-subtle"
                              >
                                {e.notes}
                              </Text>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <Text size="small" className="text-ui-fg-subtle">
                      Pas d&apos;entrées (run en cours ou aucun élément
                      traité).
                    </Text>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/* ─── Pagination ──────────────────────────────────────────── */}
      {count > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            size="small"
            variant="secondary"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Précédent
          </Button>
          <Text size="small" className="text-ui-fg-subtle">
            {page + 1} / {totalPages}
          </Text>
          <Button
            size="small"
            variant="secondary"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      ) : null}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Migration WP",
})

export default MigrationPage
