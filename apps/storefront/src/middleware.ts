import { type HttpTypes } from "@medusajs/types"
import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

/* -------------------------------------------------------------------- */
/* Legacy URL redirects (Phase 8 — WP → Medusa migration)              */
/* -------------------------------------------------------------------- */

interface CachedRedirect {
  to: string | null
  status: number
  expires_at: number
}

const REDIRECT_TTL_MS = 5 * 60 * 1000
const redirectLookupCache = new Map<string, CachedRedirect>()

/**
 * Patterns we know belong to the legacy WP site. Restricting the lookup
 * to these prefixes avoids hitting the backend on every internal route
 * (which would dominate latency on cache misses).
 */
const LEGACY_PATH_PATTERNS = [
  /^\/produit\//,
  /^\/categorie-produit\//,
  /^\/notre-histoire\/?$/,
  /^\/de-la-ferme-a-lassiette\/?$/,
  /^\/contactez-nous\/?$/,
  /^\/actualites\/?$/,
  /^\/cgv\/?$/,
  /^\/mentions-legales\/?$/,
  /^\/privacy-policy\/?$/,
  /^\/mon-compte(-2)?\/?$/,
  /^\/panier\/?$/,
  /^\/commander\/?$/,
]

function isLegacyPath(pathname: string): boolean {
  return LEGACY_PATH_PATTERNS.some((re) => re.test(pathname))
}

async function lookupRedirect(
  pathname: string
): Promise<{ to: string; status: number } | null> {
  if (!BACKEND_URL || !PUBLISHABLE_API_KEY) return null
  const now = Date.now()
  const cached = redirectLookupCache.get(pathname)
  if (cached && cached.expires_at > now) {
    return cached.to ? { to: cached.to, status: cached.status } : null
  }
  try {
    const url = new URL(`${BACKEND_URL}/store/redirects/lookup`)
    url.searchParams.set("from_path", pathname)
    const res = await fetch(url, {
      headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY },
      // Edge-friendly caching — Next will key on URL + headers.
      next: { revalidate: 300 },
    })
    if (res.status === 404) {
      redirectLookupCache.set(pathname, {
        to: null,
        status: 0,
        expires_at: now + REDIRECT_TTL_MS,
      })
      return null
    }
    if (!res.ok) return null
    const body = (await res.json()) as {
      found?: boolean
      to_path?: string
      status?: number
    }
    if (!body.found || !body.to_path) {
      redirectLookupCache.set(pathname, {
        to: null,
        status: 0,
        expires_at: now + REDIRECT_TTL_MS,
      })
      return null
    }
    const result = { to: body.to_path, status: body.status ?? 301 }
    redirectLookupCache.set(pathname, {
      to: result.to,
      status: result.status,
      expires_at: now + REDIRECT_TTL_MS,
    })
    return result
  } catch {
    // Don't blow up the request on a transient backend failure; just let
    // Next render the (probably 404) page normally.
    return null
  }
}

/* -------------------------------------------------------------------- */
/* Region detection (existing Medusa starter logic)                    */
/* -------------------------------------------------------------------- */

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    }).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
      )
    }
  }
}

/* -------------------------------------------------------------------- */
/* Middleware entrypoint                                               */
/* -------------------------------------------------------------------- */

export async function middleware(request: NextRequest) {
  // (1) Legacy-URL 301: short-circuit before any region logic so the SEO
  // signal lands on the new path with the correct status code.
  if (isLegacyPath(request.nextUrl.pathname)) {
    const hit = await lookupRedirect(request.nextUrl.pathname)
    if (hit) {
      const target = new URL(hit.to, request.nextUrl.origin)
      // Preserve incoming query string (UTM tags, etc.).
      if (request.nextUrl.search && !target.search) {
        target.search = request.nextUrl.search
      }
      return NextResponse.redirect(
        target.toString(),
        (hit.status as 301 | 302 | 307 | 308) ?? 301
      )
    }
  }

  let redirectUrl = request.nextUrl.href

  let response = NextResponse.redirect(redirectUrl, 307)

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")

  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1].includes(countryCode)

  // if one of the country codes is in the url and the cache id is set, return next
  if (urlHasCountryCode && cacheIdCookie) {
    return NextResponse.next()
  }

  // if one of the country codes is in the url and the cache id is not set, set the cache id and redirect
  if (urlHasCountryCode && !cacheIdCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })

    return response
  }

  // check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  // If no country code is set, we redirect to the relevant region.
  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  } else if (!urlHasCountryCode && !countryCode) {
    // Handle case where no valid country code exists (empty regions)
    return new NextResponse(
      "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
      { status: 500 }
    )
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
