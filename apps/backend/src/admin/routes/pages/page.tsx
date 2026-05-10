import * as React from "react"
import { Link } from "react-router-dom"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Select,
  Table,
  Text,
} from "@medusajs/ui"
import { FileText } from "lucide-react"
import { usePages, type PageStatus } from "../../hooks/use-pages"
import { useDebouncedValue } from "../../hooks/use-debounced-value"
import { PagesTable } from "../../components/pages/pages-table"

const PAGE_SIZE = 20
const ALL = "all" as const

type StatusFilter = PageStatus | typeof ALL
type LocaleFilter = string | typeof ALL

const PagesListPage = () => {
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>(ALL)
  const [locale, setLocale] = React.useState<LocaleFilter>(ALL)
  const [page, setPage] = React.useState(0)

  const debouncedSearch = useDebouncedValue(search, 300)

  // Reset to first page when filters change
  React.useEffect(() => {
    setPage(0)
  }, [debouncedSearch, status, locale])

  const query = React.useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      ...(status !== ALL ? { status } : {}),
      ...(locale !== ALL ? { locale } : {}),
    }),
    [debouncedSearch, status, locale, page]
  )

  const { data, isLoading, isError, error } = usePages(query)

  // Build the locale dropdown from currently visible pages.
  // (Acceptable for v1; if a locale isn't in the first page of results it
  // won't appear here. A dedicated /admin/pages/locales endpoint could
  // replace this later.)
  const availableLocales = React.useMemo(() => {
    const set = new Set<string>()
    data?.pages.forEach((p) => set.add(p.locale))
    return Array.from(set).sort()
  }, [data?.pages])

  const count = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <Container className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">Pages éditoriales</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {isLoading
              ? "Chargement…"
              : `${count} page${count !== 1 ? "s" : ""}`}
          </Text>
        </div>
        <Link to="/pages/new">
          <Button size="small">Créer une page</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher (titre ou slug)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          size="small"
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <Select.Trigger className="min-w-32">
            <Select.Value placeholder="Statut" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL}>Tous les statuts</Select.Item>
            <Select.Item value="draft">Brouillons</Select.Item>
            <Select.Item value="published">Publiées</Select.Item>
          </Select.Content>
        </Select>
        <Select
          size="small"
          value={locale}
          onValueChange={(v) => setLocale(v as LocaleFilter)}
        >
          <Select.Trigger className="min-w-32">
            <Select.Value placeholder="Locale" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL}>Toutes les locales</Select.Item>
            {availableLocales.map((loc) => (
              <Select.Item key={loc} value={loc}>
                {loc.toUpperCase()}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {isError && (
        <div className="rounded-md border border-ui-border-error bg-ui-bg-base p-3 text-ui-fg-error text-sm">
          Erreur de chargement : {error instanceof Error ? error.message : "inconnue"}
        </div>
      )}

      <PagesTable pages={data?.pages ?? []} isLoading={isLoading} />

      {count > PAGE_SIZE && (
        <Table.Pagination
          count={count}
          pageSize={PAGE_SIZE}
          pageIndex={page}
          pageCount={pageCount}
          canPreviousPage={page > 0}
          canNextPage={page < pageCount - 1}
          previousPage={() => setPage((p) => Math.max(0, p - 1))}
          nextPage={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          translations={{
            of: "sur",
            results: "résultats",
            pages: "pages",
            prev: "Précédent",
            next: "Suivant",
          }}
        />
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Pages",
  icon: FileText,
})

export default PagesListPage
