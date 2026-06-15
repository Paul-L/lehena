import { model } from "@medusajs/framework/utils"

/**
 * Singleton row holding WooCommerce REST API credentials used by the
 * migration. The consumer secret is encrypted at rest with AES-256-GCM
 * (see `lib/crypto.ts`). The hint is the last 4 chars of the plaintext
 * secret — safe to display in the admin UI.
 *
 * We don't use a pseudo-id like 'singleton' because Medusa generates IDs
 * automatically; the service helpers ensure at most one row exists.
 */
const WcCredentials = model.define("wc_credentials", {
  id: model.id().primaryKey(),
  url: model.text(),
  consumer_key: model.text(),
  encrypted_consumer_secret: model.text(),
  secret_hint: model.text().nullable(),
  validated_at: model.dateTime().nullable(),
})

export default WcCredentials
