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
    shipping_profile?: { id?: string | null; name?: string | null } | null
    type?: { value?: string | null } | null
  } | null
  variant?: {
    product?: {
      shipping_profile?: { id?: string | null; name?: string | null } | null
    } | null
  } | null
}

/**
 * The set of shipping-profile IDs required by the cart's line items. Medusa's
 * cart-completion validation demands a shipping method for EACH of these
 * profiles, so the storefront must only offer options whose profile is in
 * this set — otherwise the customer can pick an incompatible carrier and the
 * order fails at `placeOrder` with "shipping profiles … not satisfied".
 */
export function requiredShippingProfileIds(
  items: LineItemWithProfile[]
): Set<string> {
  const ids = new Set<string>()
  for (const it of items) {
    const id =
      it.variant?.product?.shipping_profile?.id ??
      it.product?.shipping_profile?.id ??
      null
    if (id) ids.add(id)
  }
  return ids
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
  T extends {
    provider_id?: string | null
    name?: string | null
    shipping_profile_id?: string | null
  },
>(
  options: T[],
  opts: { isMixed: boolean; requiredProfileIds?: Set<string> }
): T[] {
  const { isMixed, requiredProfileIds } = opts

  // 1) Keep only options whose profile the cart actually requires. This is
  //    the exact rule Medusa enforces at completion, so a filtered list can
  //    never lead to "shipping profiles not satisfied". (When the profile set
  //    is empty — e.g. it wasn't expanded — we skip this guard and fall back
  //    to the heuristics below to avoid hiding everything.)
  let filtered = options
  if (requiredProfileIds && requiredProfileIds.size > 0) {
    filtered = filtered.filter(
      (o) =>
        o.shipping_profile_id != null &&
        requiredProfileIds.has(o.shipping_profile_id)
    )
  }

  // 2) "(mixed)" Chronofresh options are coverage-only siblings, never a
  //    primary choice: they exist to cover the ambient profile of a mixed
  //    cart and are attached automatically at selection time (see
  //    resolveCoveringOptionIds). Hide them from the visible list in all cases.
  filtered = filtered.filter((o) => !o.name?.includes("(mixed)"))

  // 3) Mixed cart (fresh + ambient): force the whole order onto the cold
  //    chain — Chronofresh only.
  if (isMixed) {
    return filtered.filter((o) => o.provider_id === "chronofresh_chronofresh")
  }

  return filtered
}

/**
 * Given the option the customer picked, returns the full set of shipping-option
 * ids needed to cover EVERY required profile — the selection plus, for each
 * still-uncovered profile, a sibling option from the same carrier
 * (`provider_id`). This is how a mixed cart gets both a fresh Chronofresh
 * method and its hidden ambient "(mixed)" counterpart in one bulk call.
 */
export function resolveCoveringOptionIds<
  T extends {
    id: string
    provider_id?: string | null
    shipping_profile_id?: string | null
  },
>(selected: T, all: T[], requiredProfileIds: Set<string>): string[] {
  const ids = [selected.id]
  const covered = new Set<string>()
  if (selected.shipping_profile_id) {
    covered.add(selected.shipping_profile_id)
  }
  for (const profileId of Array.from(requiredProfileIds)) {
    if (covered.has(profileId)) {
      continue
    }
    const sibling = all.find(
      (o) =>
        o.id !== selected.id &&
        o.provider_id === selected.provider_id &&
        o.shipping_profile_id === profileId
    )
    if (sibling) {
      ids.push(sibling.id)
      covered.add(profileId)
    }
  }
  return ids
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
