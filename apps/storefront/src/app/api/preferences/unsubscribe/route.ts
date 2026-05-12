import { sdk } from "@lib/config"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  let body: { token?: string }
  try {
    body = (await req.json()) as { token?: string }
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }
  if (!body.token) {
    return NextResponse.json({ message: "Missing token" }, { status: 400 })
  }
  try {
    const res = await sdk.client.fetch<{ success: boolean }>(
      "/store/preferences/unsubscribe",
      {
        method: "POST",
        body: { token: body.token },
      }
    )
    return NextResponse.json(res)
  } catch (err) {
    const status =
      typeof (err as { status?: number }).status === "number"
        ? (err as { status: number }).status
        : 500
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Erreur de désinscription.",
      },
      { status }
    )
  }
}
