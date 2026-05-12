/**
 * Plausible custom-events wrapper.
 *
 * Plausible's script exposes a global `plausible()` function once
 * loaded. We type it loosely + degrade gracefully when offline (no
 * crash, no event sent).
 *
 * Convention: event names are e-commerce-standard (`view_item`,
 * `add_to_cart`, `begin_checkout`, `purchase`) so they map cleanly into
 * Plausible Goals and into GA4 if/when that gets wired in V2.
 */

type PlausibleProps = Record<string, string | number | boolean>

type PlausibleFn = (
  event: string,
  options?: {
    props?: PlausibleProps
    revenue?: { currency: string; amount: number }
  }
) => void

declare global {
  interface Window {
    plausible?: PlausibleFn
  }
}

export function trackEvent(
  event:
    | "view_item"
    | "add_to_cart"
    | "begin_checkout"
    | "purchase"
    | "subscribe_newsletter"
    | "signup"
    | "subscribe_box",
  props?: PlausibleProps,
  revenue?: { currency: string; amount: number }
) {
  if (typeof window === "undefined") return
  const fn = window.plausible
  if (!fn) return
  try {
    fn(event, {
      props,
      revenue,
    })
  } catch {
    /* never propagate analytics errors */
  }
}
