import { Badge, Table, Text } from "@medusajs/ui"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import * as React from "react"
import { Link } from "react-router-dom"

import { PagesRowActions } from "./pages-row-actions"
import { StatusBadge } from "./status-badge"

import type { Page } from "../../hooks/use-pages"

interface PagesTableProps {
  pages: Page[]
  isLoading?: boolean
}

const SkeletonRow = () => (
  <Table.Row>
    {Array.from({ length: 6 }).map((_, i) => (
      <Table.Cell key={i}>
        <div className="h-4 w-24 rounded bg-ui-bg-component animate-pulse" />
      </Table.Cell>
    ))}
  </Table.Row>
)

export const PagesTable: React.FC<PagesTableProps> = ({ pages, isLoading }) => {
  if (!isLoading && pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Text size="base" weight="plus">
          Aucune page pour l'instant
        </Text>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          Crée ta première page éditoriale pour commencer.
        </Text>
      </div>
    )
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Titre</Table.HeaderCell>
          <Table.HeaderCell>Slug</Table.HeaderCell>
          <Table.HeaderCell>Statut</Table.HeaderCell>
          <Table.HeaderCell>Locale</Table.HeaderCell>
          <Table.HeaderCell>Modifiée</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          : pages.map((page) => (
              <Table.Row key={page.id} className="hover:bg-ui-bg-base-hover">
                <Table.Cell>
                  <Link
                    to={`/pages/${page.id}`}
                    className="text-ui-fg-base hover:text-ui-fg-interactive font-medium"
                  >
                    {page.title}
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  <code className="text-xs text-ui-fg-subtle">{page.slug}</code>
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge status={page.status} />
                </Table.Cell>
                <Table.Cell>
                  <Badge color="blue" size="2xsmall">
                    {page.locale.toUpperCase()}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">
                    {formatDistanceToNow(new Date(page.updated_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </Text>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <PagesRowActions page={page} />
                </Table.Cell>
              </Table.Row>
            ))}
      </Table.Body>
    </Table>
  )
}
