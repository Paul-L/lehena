import { Container, Text } from "@medusajs/ui"
import * as React from "react"
import { useParams, Navigate } from "react-router-dom"

import { PageForm } from "../../../components/pages/page-form"
import { usePage } from "../../../hooks/use-pages"

const PageEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = usePage(id ?? null)

  if (!id) {
    return <Navigate to="/pages" replace />
  }

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-subtle">
          Chargement…
        </Text>
      </Container>
    )
  }

  if (isError || !data?.page) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-error">
          Page introuvable.
        </Text>
      </Container>
    )
  }

  return <PageForm page={data.page} />
}

export default PageEditPage
