import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"

import { MedusaError } from "@medusajs/framework/utils"

const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16
const MIN_KEY_LENGTH = 32

function deriveKey(encryptionKey: string): Buffer {
  if (!encryptionKey || encryptionKey.length < MIN_KEY_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `ENCRYPTION_KEY must be set to a string of at least ${MIN_KEY_LENGTH} characters.`
    )
  }
  return createHash("sha256").update(encryptionKey, "utf8").digest()
}

/**
 * Encrypts a UTF-8 plaintext (e.g., a WC consumer secret) using
 * AES-256-GCM. Output is base64(iv || ciphertext || authTag).
 */
export function encryptSecret(plaintext: string, encryptionKey: string): string {
  if (!plaintext) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cannot encrypt an empty value."
    )
  }
  const key = deriveKey(encryptionKey)
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, encrypted, authTag]).toString("base64")
}

/**
 * Decrypts a value produced by `encryptSecret()`. Throws when the
 * auth-tag mismatches — typically because ENCRYPTION_KEY was rotated.
 */
export function decryptSecret(
  ciphertextBase64: string,
  encryptionKey: string
): string {
  if (!ciphertextBase64) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cannot decrypt an empty value."
    )
  }
  const key = deriveKey(encryptionKey)
  const buf = Buffer.from(ciphertextBase64, "base64")
  if (buf.length < IV_BYTES + AUTH_TAG_BYTES + 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Ciphertext is shorter than the minimum expected length."
    )
  }
  const iv = buf.subarray(0, IV_BYTES)
  const authTag = buf.subarray(buf.length - AUTH_TAG_BYTES)
  const ciphertext = buf.subarray(IV_BYTES, buf.length - AUTH_TAG_BYTES)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  try {
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8")
  } catch (cause) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Decryption failed. ENCRYPTION_KEY may have changed — re-enter the secret.",
      undefined,
      cause as Error
    )
  }
}

/**
 * Returns the last `n` characters of the secret prefixed with `…`, safe
 * for display in admin lists. Never log the full secret.
 */
export function secretHint(plaintext: string, tailLength = 4): string {
  if (!plaintext) return ""
  return `…${plaintext.slice(-tailLength)}`
}
