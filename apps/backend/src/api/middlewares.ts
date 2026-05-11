import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"

import {
  CreatePageSchema,
  ListPagesQuerySchema,
  ListStorePagesQuerySchema,
  UpdatePageSchema,
} from "./admin/pages/validators"
import {
  CreateRedirectSchema,
  ListRedirectsQuerySchema,
} from "./admin/redirects/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/pages",
      method: "GET",
      middlewares: [validateAndTransformQuery(ListPagesQuerySchema, {})],
    },
    {
      matcher: "/admin/pages",
      method: "POST",
      middlewares: [validateAndTransformBody(CreatePageSchema)],
    },
    {
      matcher: "/admin/pages/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdatePageSchema)],
    },
    {
      matcher: "/store/pages",
      method: "GET",
      middlewares: [validateAndTransformQuery(ListStorePagesQuerySchema, {})],
    },
    {
      matcher: "/admin/redirects",
      method: "GET",
      middlewares: [validateAndTransformQuery(ListRedirectsQuerySchema, {})],
    },
    {
      matcher: "/admin/redirects",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateRedirectSchema)],
    },
  ],
})
