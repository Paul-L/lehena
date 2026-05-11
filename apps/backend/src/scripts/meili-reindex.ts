import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import type { ExecArgs } from "@medusajs/framework/types"

interface MeilisearchService {
  upsertIndex: (
    key: string,
    settings: { primaryKey: string }
  ) => Promise<unknown>
  replaceDocuments: (key: string, docs: unknown[]) => Promise<unknown>
}

/**
 * Full reindex of the MeiliSearch `products` and `categories` indexes.
 *
 * The plugin auto-indexes on product.created/updated/deleted via its own
 * subscribers (cf. README). This script is for cold starts, recovery after
 * a Meili crash, or a bulk re-sync after schema changes.
 *
 * Run with: `pnpm --filter @lehena/backend medusa exec ./src/scripts/meili-reindex.ts`
 * (or via the `meili:reindex` shortcut in package.json).
 */
export default async function meiliReindex({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const meili = container.resolve<MeilisearchService>("meilisearch")

  logger.info("[meili:reindex] starting full reindex")

  // ─── Products ────────────────────────────────────────────────────
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "subtitle",
      "description",
      "handle",
      "thumbnail",
      "tags.*",
      "categories.id",
      "categories.handle",
      "categories.name",
      "variants.sku",
      "status",
    ],
    filters: { status: "published" },
  })

  if (products.length > 0) {
    await meili.upsertIndex("products", { primaryKey: "id" })
    await meili.replaceDocuments("products", products)
    logger.info(`[meili:reindex] indexed ${products.length} products`)
  } else {
    logger.warn("[meili:reindex] no published products to index")
  }

  // ─── Categories ──────────────────────────────────────────────────
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: [
      "id",
      "name",
      "description",
      "handle",
      "is_active",
      "parent_category_id",
    ],
    filters: { is_active: true },
  })

  if (categories.length > 0) {
    await meili.upsertIndex("categories", { primaryKey: "id" })
    await meili.replaceDocuments("categories", categories)
    logger.info(`[meili:reindex] indexed ${categories.length} categories`)
  } else {
    logger.warn("[meili:reindex] no active categories to index")
  }

  logger.info("[meili:reindex] done")
}
