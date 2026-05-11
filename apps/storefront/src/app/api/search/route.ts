import { searchAutocomplete } from "@lib/data/search"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

/**
 * Storefront-facing autocomplete endpoint. The header drawer calls this
 * from the client; the Meili search key stays server-side.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length === 0 || q.length > 200) {
    return NextResponse.json({
      products: [],
      categories: [],
      articles: [],
    })
  }
  const result = await searchAutocomplete(q)
  return NextResponse.json(result)
}
