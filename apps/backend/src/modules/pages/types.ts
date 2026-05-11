import { type PAGE_STATUSES } from "./models/page"

export type PageStatus = (typeof PAGE_STATUSES)[number]

export const PAGE_RESERVED_SLUGS = [
  "cart",
  "checkout",
  "products",
  "product",
  "account",
  "admin",
  "api",
  "store",
  "collections",
  "categories",
  "search",
  "login",
  "register",
  "orders",
  "_next",
  "static",
] as const

export const PAGE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
