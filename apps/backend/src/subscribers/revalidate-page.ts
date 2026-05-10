import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

type PageEventData = {
  id: string
  slug?: string
  locale?: string
}

const REVALIDATE_TIMEOUT_MS = 5_000
const REVALIDATE_PATHS = ["/"] as const

export default async function revalidatePageHandler({
  event: { name: eventName, data },
  container,
}: SubscriberArgs<PageEventData>) {
  const logger = container.resolve("logger")

  const storefrontUrl = process.env.STOREFRONT_URL
  const revalidateSecret = process.env.REVALIDATE_SECRET

  if (!storefrontUrl || !revalidateSecret) {
    logger.warn(
      `[pages:revalidate] ${eventName} for ${data.id} — skipped (STOREFRONT_URL or REVALIDATE_SECRET not set).`
    )
    return
  }

  if (!data.slug) {
    logger.warn(
      `[pages:revalidate] ${eventName} for ${data.id} — missing slug in event payload.`
    )
    return
  }

  const url = `${storefrontUrl.replace(/\/$/, "")}/api/revalidate`
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    REVALIDATE_TIMEOUT_MS
  )

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": revalidateSecret,
      },
      body: JSON.stringify({
        slug: data.slug,
        locale: data.locale,
        paths: REVALIDATE_PATHS,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      logger.warn(
        `[pages:revalidate] ${eventName} → ${url} responded ${response.status} for slug "${data.slug}".`
      )
      return
    }

    logger.info(
      `[pages:revalidate] ${eventName} → ${url} ok for slug "${data.slug}".`
    )
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    logger.warn(
      `[pages:revalidate] ${eventName} → ${url} failed for slug "${data.slug}": ${reason}`
    )
  } finally {
    clearTimeout(timeout)
  }
}

export const config: SubscriberConfig = {
  event: [
    "page.published",
    "page.updated",
    "page.unpublished",
    "page.deleted",
  ],
}
