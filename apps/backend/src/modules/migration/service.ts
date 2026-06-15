import { MedusaError, MedusaService } from "@medusajs/framework/utils"

import { decryptSecret, encryptSecret, secretHint } from "./lib/crypto"
import MigrationRun from "./models/migration-run"
import WcCredentials from "./models/wc-credentials"

export interface WcCredentialsPublic {
  url: string
  consumer_key: string
  secret_hint: string | null
  validated_at: Date | null
}

export interface WcCredentialsResolved {
  url: string
  consumerKey: string
  consumerSecret: string
}

class MigrationModuleService extends MedusaService({
  MigrationRun,
  WcCredentials,
}) {
  /**
   * Returns the public-safe view of the stored credentials (never the
   * decrypted secret). Null when no row has been saved yet.
   */
  async getWcCredentialsPublic(): Promise<WcCredentialsPublic | null> {
    const rows = await this.listWcCredentials({}, { take: 1 })
    const row = rows[0]
    if (!row) return null
    return {
      url: row.url,
      consumer_key: row.consumer_key,
      secret_hint: row.secret_hint,
      validated_at: row.validated_at,
    }
  }

  /**
   * Stores (or replaces) the singleton credentials row. The secret is
   * encrypted with ENCRYPTION_KEY before being persisted.
   */
  async saveWcCredentials(input: {
    url: string
    consumer_key: string
    consumer_secret: string
  }): Promise<WcCredentialsPublic> {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "ENCRYPTION_KEY env var is required to store WC credentials securely."
      )
    }
    const encrypted = encryptSecret(input.consumer_secret, encryptionKey)
    const hint = secretHint(input.consumer_secret)

    const existing = await this.listWcCredentials({}, { take: 1 })
    if (existing[0]) {
      await this.updateWcCredentials({
        id: existing[0].id,
        url: input.url,
        consumer_key: input.consumer_key,
        encrypted_consumer_secret: encrypted,
        secret_hint: hint,
        // Reset validation when creds change — operator must re-test.
        validated_at: null,
      })
    } else {
      await this.createWcCredentials({
        url: input.url,
        consumer_key: input.consumer_key,
        encrypted_consumer_secret: encrypted,
        secret_hint: hint,
        validated_at: null,
      })
    }

    const refreshed = await this.getWcCredentialsPublic()
    if (!refreshed) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Credentials row vanished right after save."
      )
    }
    return refreshed
  }

  /**
   * Internal helper for the WC reader: returns url + key + decrypted
   * secret. Returns null when no credentials are stored yet (caller
   * should fall back to env vars or surface a configuration error).
   */
  async resolveWcCredentials(): Promise<WcCredentialsResolved | null> {
    const rows = await this.listWcCredentials({}, { take: 1 })
    const row = rows[0]
    if (!row) return null
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "ENCRYPTION_KEY env var is required to decrypt WC credentials."
      )
    }
    return {
      url: row.url,
      consumerKey: row.consumer_key,
      consumerSecret: decryptSecret(
        row.encrypted_consumer_secret,
        encryptionKey
      ),
    }
  }

  /**
   * Marks the saved credentials as validated. Called after a successful
   * test ping against the WC REST API.
   */
  async markWcCredentialsValidated(): Promise<void> {
    const rows = await this.listWcCredentials({}, { take: 1 })
    const row = rows[0]
    if (!row) return
    await this.updateWcCredentials({ id: row.id, validated_at: new Date() })
  }
}

export default MigrationModuleService
