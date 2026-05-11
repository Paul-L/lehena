import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createApiKeysWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

import type { MedusaContainer } from "@medusajs/framework/types"

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  function (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[]
    store_id: string
  }) {
    const normalizedInput = transform({ input }, (data) => ({
      selector: { id: data.input.store_id },
      update: {
        supported_currencies: data.input.supported_currencies.map((c) => ({
          currency_code: c.currency_code,
          is_default: c.is_default ?? false,
        })),
      },
    }))
    const stores = updateStoresStep(normalizedInput)
    return new WorkflowResponse(stores)
  }
)

export async function seedStore(container: MedusaContainer): Promise<{
  storeId: string
  defaultSalesChannelId: string
  publishableApiKeyId: string
}> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  logger.info("[seed.store] currencies + sales channel + API key")

  const [store] = await storeModuleService.listStores()
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!defaultSalesChannel.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    })
    defaultSalesChannel = result
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [{ currency_code: "eur", is_default: true }],
    },
  })

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_sales_channel_id: defaultSalesChannel[0].id },
    },
  })

  // Publishable API key — idempotent: reuse if one already exists.
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  })

  let publishableApiKeyId: string
  if (existingKeys && existingKeys.length > 0) {
    publishableApiKeyId = existingKeys[0].id
  } else {
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Lehena Storefront", type: "publishable", created_by: "" },
        ],
      },
    })
    publishableApiKeyId = created.id
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKeyId,
      add: [defaultSalesChannel[0].id],
    },
  })

  return {
    storeId: store.id,
    defaultSalesChannelId: defaultSalesChannel[0].id,
    publishableApiKeyId,
  }
}
