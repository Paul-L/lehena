import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"

import {
  ListContactSubmissionsQuerySchema,
  UpdateContactSubmissionSchema,
} from "./admin/contact-submissions/validators"
import { ExportOrdersSchema } from "./admin/exports/orders/validators"
import { UpdateFaqItemSchema } from "./admin/faq-items/[id]/validators"
import { SaveWcCredentialsSchema } from "./admin/migration/wc-credentials/validators"
import {
  CreateMigrationRunSchema,
  ListMigrationRunsQuerySchema,
} from "./admin/migration-runs/validators"
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
  ListAdminReviewsQuerySchema,
  UpdateReviewStatusSchema,
} from "./admin/reviews/validators"
import {
  RequestMagicLinkSchema,
  VerifyMagicLinkSchema,
} from "./store/auth/magic-link/validators"
import { SetShippingMethodsBulkSchema } from "./store/carts/[id]/shipping-methods-bulk/validators"
import { SubmitContactSchema } from "./store/contact/validators"
import {
  DeleteConfirmSchema,
  DeleteRequestSchema,
} from "./store/customers/me/gdpr/validators"
import { UnsubscribeSchema } from "./store/preferences/validators"
import {
  ListReviewsQuerySchema,
  SubmitReviewSchema,
} from "./store/products/[id]/reviews/validators"
import { ListFacetedProductsQuerySchema } from "./store/products-faceted/validators"
import {
  MutateSubscriptionSchema,
  StartCheckoutSchema,
} from "./store/subscriptions/validators"
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
      matcher: "/store/carts/:id/shipping-methods-bulk",
      method: "POST",
      middlewares: [validateAndTransformBody(SetShippingMethodsBulkSchema)],
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
      matcher: "/store/products/:id/reviews",
      method: "GET",
      middlewares: [validateAndTransformQuery(ListReviewsQuerySchema, {})],
    },
    {
      matcher: "/store/products/:id/reviews",
      method: "POST",
      middlewares: [validateAndTransformBody(SubmitReviewSchema)],
    },
    {
      matcher: "/admin/reviews",
      method: "GET",
      middlewares: [validateAndTransformQuery(ListAdminReviewsQuerySchema, {})],
    },
    {
      matcher: "/admin/reviews/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateReviewStatusSchema)],
    },
    {
      matcher: "/admin/exports/orders",
      method: "POST",
      middlewares: [validateAndTransformBody(ExportOrdersSchema)],
    },
    {
      matcher: "/store/subscriptions/checkout",
      method: "POST",
      middlewares: [validateAndTransformBody(StartCheckoutSchema)],
    },
    {
      matcher: "/store/subscriptions/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(MutateSubscriptionSchema)],
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
      matcher: "/store/preferences/unsubscribe",
      method: "POST",
      middlewares: [validateAndTransformBody(UnsubscribeSchema)],
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
    {
      matcher: "/admin/migration-runs",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(ListMigrationRunsQuerySchema, {}),
      ],
    },
    {
      matcher: "/admin/migration-runs",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateMigrationRunSchema)],
    },
    {
      matcher: "/admin/migration/wc-credentials",
      method: "POST",
      middlewares: [validateAndTransformBody(SaveWcCredentialsSchema)],
    },
  ],
})
