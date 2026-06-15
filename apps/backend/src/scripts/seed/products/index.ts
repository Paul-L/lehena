import { readFile } from "node:fs/promises"
import path from "node:path"

import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"

import { SHIPPING_PROFILE_NAMES } from "../fulfillment"
import { PRODUCT_TYPE_VALUES, type ProductTypeValue } from "../regions"

import { ALL_PRODUCTS } from "./data"

import type { ProductSeed } from "./types"
import type { MedusaContainer } from "@medusajs/framework/types"

const SEED_ASSETS_DIR = path.resolve(
  process.cwd(),
  "seed-assets/products"
)
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

interface SeedProductsContext {
  defaultSalesChannelId: string
  stockLocationId: string
  productTypeIds: Record<ProductTypeValue, string>
  shippingProfileIds: { fresh: string; ambient: string }
}

async function uploadSeedImage(
  container: MedusaContainer,
  filename: string
): Promise<string | null> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const fileService = container.resolve(Modules.FILE)
  const ext = path.extname(filename).toLowerCase()
  const mimeType = MIME_BY_EXT[ext] ?? "application/octet-stream"
  try {
    const buf = await readFile(path.join(SEED_ASSETS_DIR, filename))
    // The local file provider decodes `content` as base64 first; anything
    // that isn't valid base64 falls back to a UTF-8 decode, which mangles
    // binary bytes ≥ 0x80 (0xFF → 0xC3 0xBF) and produces a corrupt image.
    // Always hand it base64 so the bytes round-trip intact.
    const [uploaded] = await fileService.createFiles([
      { filename, mimeType, content: buf.toString("base64") },
    ])
    return uploaded.url
  } catch (err) {
    logger.warn(
      `[seed.products] could not upload image ${filename}: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
    return null
  }
}

export async function seedProducts(
  container: MedusaContainer,
  context: SeedProductsContext
): Promise<{ created: number; skipped: number }> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = container.resolve(Modules.INVENTORY)

  logger.info(`[seed.products] ${ALL_PRODUCTS.length} Lehena products`)

  // ─── Resolve category IDs (by handle) ─────────────────────────────
  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })
  const categoryByHandle = new Map((cats ?? []).map((c) => [c.handle, c.id]))

  // ─── Skip products that already exist (idempotency) ───────────────
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  const existingHandles = new Set((existingProducts ?? []).map((p) => p.handle))

  let created = 0
  let skipped = 0

  for (const product of ALL_PRODUCTS) {
    if (existingHandles.has(product.handle)) {
      skipped++
      continue
    }

    const categoryIds = product.category_handles
      .map((h) => categoryByHandle.get(h))
      .filter((id): id is string => Boolean(id))
    if (categoryIds.length === 0) {
      logger.warn(
        `[seed.products] skipping ${product.handle}: no resolved category`
      )
      continue
    }

    const typeId =
      context.productTypeIds[
        PRODUCT_TYPE_VALUES[
          product.product_type as keyof typeof PRODUCT_TYPE_VALUES
        ] as ProductTypeValue
      ]
    const profileId =
      product.shipping_kind === "fresh"
        ? context.shippingProfileIds.fresh
        : context.shippingProfileIds.ambient

    const imageUrl = product.image_filename
      ? await uploadSeedImage(container, product.image_filename)
      : null

    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: product.title,
            subtitle: product.subtitle,
            handle: product.handle,
            description: product.description,
            status: ProductStatus.PUBLISHED,
            type_id: typeId,
            shipping_profile_id: profileId,
            category_ids: categoryIds,
            sales_channels: [{ id: context.defaultSalesChannelId }],
            ...(imageUrl
              ? { thumbnail: imageUrl, images: [{ url: imageUrl }] }
              : {}),
            options: [
              { title: "Format", values: product.variants.map((v) => v.title) },
            ],
            variants: product.variants.map((v) => ({
              title: v.title,
              sku: v.sku,
              manage_inventory: v.manage_inventory ?? true,
              allow_backorder: false,
              prices: [{ currency_code: "eur", amount: v.price_eur }],
              options: { Format: v.title },
            })),
          },
        ],
        additional_data: {
          catalog: {
            product: product.details,
            variants: product.variants.map((v) => ({
              sku: v.sku,
              weight_grams: v.weight_grams,
              format: v.format,
            })),
          },
        },
      },
    })

    created++

    // ─── Inventory levels for newly created variants ───────────────
    const { data: refreshed } = (await query.graph({
      entity: "product",
      fields: [
        "id",
        "handle",
        "variants.id",
        "variants.sku",
        "variants.inventory_items.inventory_item_id",
      ],
      filters: { handle: product.handle },
    })) as {
      data: {
        id: string
        variants?: {
          id: string
          sku: string | null
          inventory_items?: { inventory_item_id: string }[]
        }[]
      }[]
    }
    const newProd = refreshed?.[0]
    if (newProd?.variants) {
      const levelsToCreate: {
        inventory_item_id: string
        location_id: string
        stocked_quantity: number
      }[] = []
      for (const variant of newProd.variants) {
        const seed = product.variants.find((v) => v.sku === variant.sku)
        if (!seed) continue
        const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
        if (!inventoryItemId) continue
        levelsToCreate.push({
          inventory_item_id: inventoryItemId,
          location_id: context.stockLocationId,
          stocked_quantity: seed.initial_stock ?? 10,
        })
      }
      if (levelsToCreate.length > 0) {
        await createInventoryLevelsWorkflow(container).run({
          input: { inventory_levels: levelsToCreate },
        })
      }
    }
  }

  logger.info(
    `[seed.products] created=${created} skipped=${skipped} total=${ALL_PRODUCTS.length}`
  )
  // touch inventoryService to keep import used in build environments that
  // strip unused imports — TODO Phase 5 use this for inventory_levels.
  void inventoryService
  return { created, skipped }
}
