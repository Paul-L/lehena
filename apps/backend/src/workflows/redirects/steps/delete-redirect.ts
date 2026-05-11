import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { REDIRECTS_MODULE } from "../../../modules/redirects"

interface DeleteRedirectInput {
  id: string
}

interface Snapshot {
  id: string
  from_path: string
  to_path: string
  status: number
  source: "product" | "category" | "page" | "manual"
  source_id: string | null
  note: string | null
}

export const deleteRedirectStep = createStep(
  "delete-redirect",
  async (input: DeleteRedirectInput, { container }) => {
    const redirects = container.resolve(REDIRECTS_MODULE)
    const existing = await redirects.retrieveRedirect(input.id)
    const snapshot: Snapshot = {
      id: existing.id,
      from_path: existing.from_path,
      to_path: existing.to_path,
      status: existing.status,
      source: existing.source,
      source_id: existing.source_id,
      note: existing.note,
    }
    await redirects.deleteRedirects(input.id)
    return new StepResponse({ id: input.id }, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) {
      return
    }
    const redirects = container.resolve(REDIRECTS_MODULE)
    // Re-create with the same id so any reference stays valid.
    await redirects.createRedirects([
      {
        id: snapshot.id,
        from_path: snapshot.from_path,
        to_path: snapshot.to_path,
        status: snapshot.status,
        source: snapshot.source,
        source_id: snapshot.source_id,
        note: snapshot.note,
      },
    ])
  }
)
