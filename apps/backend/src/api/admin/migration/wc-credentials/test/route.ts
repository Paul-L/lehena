import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { MIGRATION_MODULE } from "../../../../../modules/migration"

/**
 * Pings the configured WC REST API with the saved credentials. On a 2xx
 * response we mark the row as validated; otherwise we surface the status
 * + body excerpt back to the admin so the operator can fix the config.
 *
 * We hit `/wp-json/wc/v3/products?per_page=1` which is cheap, requires
 * auth, and confirms the consumer key/secret pair has read access.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const service = req.scope.resolve(MIGRATION_MODULE)
  const resolved = await service.resolveWcCredentials()
  if (!resolved) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Aucune credential WC enregistrée. Sauvegarde d'abord les identifiants."
    )
  }

  const url = new URL(`${resolved.url.replace(/\/$/, "")}/wp-json/wc/v3/products`)
  url.searchParams.set("per_page", "1")
  const token = Buffer.from(
    `${resolved.consumerKey}:${resolved.consumerSecret}`
  ).toString("base64")

  let status: number
  let bodyExcerpt = ""
  try {
    const wcRes = await fetch(url, {
      headers: { Authorization: `Basic ${token}` },
    })
    status = wcRes.status
    if (!wcRes.ok) {
      const text = await wcRes.text()
      bodyExcerpt = text.slice(0, 300)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({
      ok: false,
      status: 0,
      error: `Connexion impossible: ${message}`,
    })
    return
  }

  if (status < 200 || status >= 300) {
    res.status(200).json({
      ok: false,
      status,
      error: `WC a répondu ${status}${bodyExcerpt ? ` — ${bodyExcerpt}` : ""}`,
    })
    return
  }

  await service.markWcCredentialsValidated()
  const credentials = await service.getWcCredentialsPublic()
  res.json({ ok: true, status, credentials })
}
