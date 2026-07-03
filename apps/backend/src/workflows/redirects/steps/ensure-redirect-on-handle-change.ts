import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  REDIRECTS_MODULE,
  type RedirectsModuleService,
} from "../../../modules/redirects"
import {
  buildResourcePath,
  type ResourceType,
} from "../../../modules/redirects/types"

interface EnsureRedirectOnHandleChangeInput {
  resource_type: ResourceType
  resource_id: string
  current_handle: string
}

interface CompensationData {
  created_redirect_id: string | null
  previous_snapshot_handle: string | null
  snapshot_id: string | null
  is_new_snapshot: boolean
}

export const ensureRedirectOnHandleChangeStep = createStep(
  "ensure-redirect-on-handle-change",
  async (
    input: EnsureRedirectOnHandleChangeInput,
    { container }
  ): Promise<
    StepResponse<{ created_redirect_id: string | null }, CompensationData>
  > => {
    const redirects =
      container.resolve<RedirectsModuleService>(REDIRECTS_MODULE)

    // 1. Find the existing snapshot for this resource (if any).
    const [existing] = await redirects.listHandleSnapshots(
      {
        resource_type: input.resource_type,
        resource_id: input.resource_id,
      },
      { take: 1 }
    )

    // 2. First time we see this resource → initialise the snapshot, no redirect.
    if (!existing) {
      const [snapshot] = await redirects.createHandleSnapshots([
        {
          resource_type: input.resource_type,
          resource_id: input.resource_id,
          handle: input.current_handle,
        },
      ])
      return new StepResponse(
        { created_redirect_id: null },
        {
          created_redirect_id: null,
          snapshot_id: snapshot.id,
          previous_snapshot_handle: null,
          is_new_snapshot: true,
        }
      )
    }

    // 3. No change → noop.
    if (existing.handle === input.current_handle) {
      return new StepResponse(
        { created_redirect_id: null },
        {
          created_redirect_id: null,
          snapshot_id: existing.id,
          previous_snapshot_handle: existing.handle,
          is_new_snapshot: false,
        }
      )
    }

    // 4. Real handle change → create the redirect + update snapshot.
    const fromPath = buildResourcePath(input.resource_type, existing.handle)
    const toPath = buildResourcePath(input.resource_type, input.current_handle)

    let createdRedirectId: string | null = null
    try {
      const [redirect] = await redirects.createRedirects([
        {
          from_path: fromPath,
          to_path: toPath,
          status: 301,
          source: input.resource_type,
          source_id: input.resource_id,
        },
      ])
      createdRedirectId = redirect.id
    } catch (e) {
      // A redirect FROM this path already exists (e.g. handle ping-pongs).
      // We swallow the duplicate-key error rather than failing the update.
      const msg = e instanceof Error ? e.message : String(e)
      if (!/duplicate|unique/i.test(msg)) {
        throw e
      }
    }

    const previousHandle = existing.handle
    await redirects.updateHandleSnapshots({
      id: existing.id,
      handle: input.current_handle,
    })

    return new StepResponse(
      { created_redirect_id: createdRedirectId },
      {
        created_redirect_id: createdRedirectId,
        snapshot_id: existing.id,
        previous_snapshot_handle: previousHandle,
        is_new_snapshot: false,
      }
    )
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const redirects =
      container.resolve<RedirectsModuleService>(REDIRECTS_MODULE)

    if (compensation.created_redirect_id) {
      await redirects.deleteRedirects(compensation.created_redirect_id)
    }
    if (compensation.is_new_snapshot && compensation.snapshot_id) {
      await redirects.deleteHandleSnapshots(compensation.snapshot_id)
    } else if (
      compensation.snapshot_id &&
      compensation.previous_snapshot_handle !== null
    ) {
      await redirects.updateHandleSnapshots({
        id: compensation.snapshot_id,
        handle: compensation.previous_snapshot_handle,
      })
    }
  }
)

export type { EnsureRedirectOnHandleChangeInput }
