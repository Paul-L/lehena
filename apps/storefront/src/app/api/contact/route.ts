import { sdk } from "@lib/config"
import { NextResponse } from "next/server"

interface ContactPayload {
  name?: string
  email?: string
  subject?: string
  message?: string
  locale?: string
  source_slug?: string
}

const isString = (v: unknown): v is string => typeof v === "string"

/**
 * Storefront relay → Medusa `/store/contact`. Keeps the publishable key and
 * any session/auth headers server-side; the browser never talks to the
 * backend directly.
 *
 * Returns 4xx if the backend rejects the payload, 5xx on transport errors.
 */
export async function POST(req: Request) {
  let body: ContactPayload
  try {
    body = (await req.json()) as ContactPayload
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 })
  }

  if (
    !isString(body.name) ||
    !isString(body.email) ||
    !isString(body.subject) ||
    !isString(body.message)
  ) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    )
  }

  try {
    const res = await sdk.client.fetch<{
      submission: { id: string; status: string }
    }>("/store/contact", {
      method: "POST",
      body: {
        name: body.name,
        email: body.email,
        subject: body.subject,
        message: body.message,
        locale: body.locale ?? "fr",
        source_slug: body.source_slug,
      },
    })
    return NextResponse.json(res)
  } catch (err) {
    const status =
      typeof (err as { status?: number }).status === "number"
        ? (err as { status: number }).status
        : 500
    const message =
      err instanceof Error ? err.message : "Erreur d'envoi du message."
    return NextResponse.json({ message }, { status })
  }
}
