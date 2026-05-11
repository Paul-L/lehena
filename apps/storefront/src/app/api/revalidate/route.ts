import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Webhook called by the Medusa backend (`src/subscribers/revalidate-page.ts`)
 * whenever a page is published, updated, unpublished, or deleted.
 *
 * Body shape: `{ slug?: string; locale?: string; paths?: string[] }`
 *
 * Strategy:
 *   - Always flush the `pages` tag (sitemap, generateStaticParams)
 *   - If `slug` provided, flush `page-${slug}` tag (the cached fetch in
 *     `lib/data/pages.ts` is tagged with this)
 *   - If both `slug` and `locale` provided, flush the page path
 *     `/${locale}/${slug}` directly so the ISR cache is invalidated
 *   - Each path in `paths` is also revalidated
 */

interface RevalidateBody {
  slug?: string
  locale?: string
  paths?: string[]
}

const isString = (v: unknown): v is string => typeof v === "string"

function isValidBody(body: unknown): body is RevalidateBody {
  if (!body || typeof body !== "object") return false
  const b = body as Record<string, unknown>
  if (b.slug !== undefined && !isString(b.slug)) return false
  if (b.locale !== undefined && !isString(b.locale)) return false
  if (b.paths !== undefined) {
    if (!Array.isArray(b.paths)) return false
    if (!b.paths.every(isString)) return false
  }
  return true
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected) {
    console.error(
      "[api/revalidate] REVALIDATE_SECRET is not configured — refusing all calls."
    )
    return NextResponse.json(
      { error: "Server is not configured for revalidation." },
      { status: 500 }
    )
  }

  const provided = request.headers.get("x-revalidate-secret")
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid body shape" }, { status: 400 })
  }

  const flushedTags: string[] = []
  const flushedPaths: string[] = []

  try {
    revalidateTag("pages")
    flushedTags.push("pages")

    if (body.slug) {
      const tag = `page-${body.slug}`
      revalidateTag(tag)
      flushedTags.push(tag)

      if (body.locale) {
        const path = `/${body.locale}/${body.slug}`
        revalidatePath(path)
        flushedPaths.push(path)
      }
    }

    for (const path of body.paths ?? []) {
      revalidatePath(path)
      flushedPaths.push(path)
    }

    console.log(
      `[api/revalidate] OK — slug=${body.slug ?? "-"} locale=${
        body.locale ?? "-"
      } tags=[${flushedTags.join(",")}] paths=[${flushedPaths.join(",")}]`
    )

    return NextResponse.json({
      revalidated: true,
      tags: flushedTags,
      paths: flushedPaths,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`[api/revalidate] revalidation failed: ${message}`)
    return NextResponse.json(
      { error: "Revalidation failed", message },
      { status: 500 }
    )
  }
}
