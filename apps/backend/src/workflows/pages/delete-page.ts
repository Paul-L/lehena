import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  deletePageStep,
  type DeletePageStepInput,
} from "./steps/delete-page"

export type DeletePageInput = DeletePageStepInput

export const deletePageWorkflow = createWorkflow(
  "delete-page",
  function (input: DeletePageInput) {
    const { data: pages } = useQueryGraphStep({
      entity: "page",
      fields: ["id", "slug", "locale"],
      filters: { id: input.id },
    })

    const deleted = deletePageStep(input)

    const eventData = transform(
      { pages, deleted },
      ({ pages, deleted }) => ({
        id: deleted.id,
        slug: pages[0]?.slug,
        locale: pages[0]?.locale,
      })
    )

    emitEventStep({
      eventName: "page.deleted",
      data: eventData,
    })

    return new WorkflowResponse(deleted)
  }
)
