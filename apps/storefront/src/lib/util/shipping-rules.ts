/**
 * Storefront-side mirror of the backend shipping business rules.
 *
 * `FREE_SHIPPING_THRESHOLD_CENTS` is duplicated here because the backend
 * computes the same threshold for `calculatePrice`. Keep them in sync —
 * a future cleanup can expose the value on the cart payload.
 */

const FREE_SHIPPING_CENTS_DEFAULT = 5000

export function freeShippingThresholdCents(): number {
  const raw = process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS
  const parsed = raw ? parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : FREE_SHIPPING_CENTS_DEFAULT
}

/** Cart subtotal cents, defensive against missing tax data. */
export function cartSubtotalCents(cart: {
  item_subtotal?: number | string | null
  subtotal?: number | string | null
}): number {
  const raw = cart.item_subtotal ?? cart.subtotal ?? 0
  const n = typeof raw === "string" ? parseFloat(raw) : raw
  return typeof n === "number" && Number.isFinite(n) ? n : 0
}

export function freeShippingApplies(cart: {
  item_subtotal?: number | string | null
  subtotal?: number | string | null
}): boolean {
  return cartSubtotalCents(cart) >= freeShippingThresholdCents()
}

/**
 * Tells whether a cart has both fresh and ambient line items, in which case
 * we force the entire order onto the cold chain. We detect by looking at
 * each line item's `product.shipping_profile.name` if expanded, falling
 * back to a heuristic on `requires_shipping` if not.
 */
interface LineItemWithProfile {
  product?: {
    shipping_profile?: { name?: string | null } | null
    type?: { value?: string | null } | null
  } | null
  variant?: {
    product?: {
      shipping_profile?: { name?: string | null } | null
    } | null
  } | null
}

export function classifyCartProfiles(items: LineItemWithProfile[]): {
  has_fresh: boolean
  has_ambient: boolean
  is_mixed: boolean
} {
  let has_fresh = false
  let has_ambient = false
  for (const it of items) {
    const profileName =
      it.variant?.product?.shipping_profile?.name ??
      it.product?.shipping_profile?.name ??
      null
    if (profileName === "fresh_chronofresh") has_fresh = true
    else if (profileName === "ambient_colissimo") has_ambient = true
  }
  return { has_fresh, has_ambient, is_mixed: has_fresh && has_ambient }
}

/**
 * Filter shipping options for the storefront picker. Rule: when the cart is
 * mixed (fresh + ambient), every shipping method MUST be Chronofresh
 * (provider_id `chronofresh_chronofresh`). For solo-ambient carts, we hide
 * the Chronofresh-mixed coverage options that only exist for the mixed case.
 */
export function filterShippingOptionsForCart<
  T extends { provider_id?: string | null; name?: string | null },
>(options: T[], isMixed: boolean): T[] {
  if (isMixed) {
    return options.filter((o) => o.provider_id === "chronofresh_chronofresh")
  }
  // Solo-ambient (or solo-fresh): hide the "Chronofresh ... (mixed)" options.
  return options.filter((o) => !o.name?.includes("(mixed)"))
}

export interface VatBreakdown {
  /** Rate as a fraction (e.g. 0.055, 0.2). */
  rate: number
  /** Tax amount in cents. */
  amount: number
}

/**
 * Group line item tax_lines by rate so the storefront can display a
 * detailed VAT breakdown (5.5 % alimentaire / 20 % patxaran-spiritueux).
 */
export function vatBreakdown(cart: {
  items?:
    | {
        tax_lines?:
          | {
              rate?: number | string | null
              total?: number | string | null
            }[]
          | null
      }[]
    | null
}): VatBreakdown[] {
  const byRate = new Map<number, number>()
  for (const it of cart.items ?? []) {
    for (const tl of it.tax_lines ?? []) {
      const rate =
        typeof tl.rate === "number"
          ? tl.rate
          : typeof tl.rate === "string"
            ? parseFloat(tl.rate)
            : NaN
      if (!Number.isFinite(rate)) continue
      const total =
        typeof tl.total === "number"
          ? tl.total
          : typeof tl.total === "string"
            ? parseFloat(tl.total)
            : 0
      byRate.set(rate, (byRate.get(rate) ?? 0) + total)
    }
  }
  return Array.from(byRate.entries())
    .map(([rate, amount]) => ({ rate, amount }))
    .sort((a, b) => a.rate - b.rate)
}
