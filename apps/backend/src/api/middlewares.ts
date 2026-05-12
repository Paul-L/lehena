import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"

import {
  ListContactSubmissionsQuerySchema,
  UpdateContactSubmissionSchema,
} from "./admin/contact-submissions/validators"
import { UpdateFaqItemSchema } from "./admin/faq-items/[id]/validators"
import {
  CreatePageSchema,
  ListPagesQuerySchema,
  ListStorePagesQuerySchema,
  TranslatePageSchema,
  UpdatePageSchema,
} from "./admin/pages/validators"
import {
  CreateProductFaqItemSchema,
  ReorderProductFaqItemsSchema,
} from "./admin/products/[id]/faq-items/validators"
import {
  CreateRedirectSchema,
  ListRedirectsQuerySchema,
} from "./admin/redirects/validators"
import {
  RequestMagicLinkSchema,
  VerifyMagicLinkSchema,
} from "./store/auth/magic-link/validators"
import { SubmitContactSchema } from "./store/contact/validators"
import {
  DeleteConfirmSchema,
  DeleteRequestSchema,
} from "./store/customers/me/gdpr/validators"
import { ListFacetedProductsQuerySchema } from "./store/products-faceted/validators"
import { AddWishlistItemSchema } from "./store/wishlist/validators"

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
      matcher: "/admin/pages/:id/translate",
      method: "POST",
      middlewares: [validateAndTransformBody(TranslatePageSchema)],
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
    {
      matcher: "/admin/products/:id/faq-items",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateProductFaqItemSchema)],
    },
    {
      matcher: "/admin/products/:id/faq-items/reorder",
      method: "POST",
      middlewares: [validateAndTransformBody(ReorderProductFaqItemsSchema)],
    },
    {
      matcher: "/admin/faq-items/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateFaqItemSchema)],
    },
    {
      matcher: "/store/products-faceted",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(ListFacetedProductsQuerySchema, {}),
      ],
    },
    {
      matcher: "/store/contact",
      method: "POST",
      middlewares: [validateAndTransformBody(SubmitContactSchema)],
    },
    {
      matcher: "/store/auth/magic-link",
      method: "POST",
      middlewares: [validateAndTransformBody(RequestMagicLinkSchema)],
    },
    {
      matcher: "/store/auth/magic-link/verify",
      method: "POST",
      middlewares: [validateAndTransformBody(VerifyMagicLinkSchema)],
    },
    {
      matcher: "/store/wishlist",
      method: "POST",
      middlewares: [validateAndTransformBody(AddWishlistItemSchema)],
    },
    {
      matcher: "/store/customers/me/gdpr/delete-request",
      method: "POST",
      middlewares: [validateAndTransformBody(DeleteRequestSchema)],
    },
    {
      matcher: "/store/customers/me/gdpr/delete-confirm",
      method: "POST",
      middlewares: [validateAndTransformBody(DeleteConfirmSchema)],
    },
    {
      matcher: "/admin/contact-submissions",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(ListContactSubmissionsQuerySchema, {}),
      ],
    },
    {
      matcher: "/admin/contact-submissions/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateContactSubmissionSchema)],
    },
  ],
})
