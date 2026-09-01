"use client"

import { trackCustom } from "@lib/analytics/plausible"
import { useEffect } from "react"
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals"

/**
 * Core Web Vitals RUM (Real User Monitoring).
 *
 * Subscribes to the web-vitals callbacks once and forwards each metric to
 * Plausible as a custom event (`WebVital:LCP`, `WebVital:CLS`, …). The
 * Plausible wrapper degrades gracefully when the script isn't loaded, so
 * this is a no-op in that case. Renders nothing.
 *
 * Mount once, high in the client tree (e.g. root layout).
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    const report = (metric: Metric) => {
      trackCustom(`WebVital:${metric.name}`, {
        value: Math.round(metric.value),
        rating: metric.rating,
        path: window.location.pathname,
      })
    }

    onCLS(report)
    onINP(report)
    onLCP(report)
    onFCP(report)
    onTTFB(report)
  }, [])

  return null
}
