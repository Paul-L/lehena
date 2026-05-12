import jwt from "jsonwebtoken"

/** Token mint/verify helpers for one-click unsubscribe links in emails. */

interface PreferencesPayload {
  email: string
  scope: "preferences"
  iat?: number
  exp?: number
}

const TTL = "180d"

export function signPreferencesToken(email: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is required to mint preferences tokens.")
  }
  return jwt.sign({ email, scope: "preferences" }, secret, {
    expiresIn: TTL,
  })
}

export function verifyPreferencesToken(token: string): string | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  try {
    const payload = jwt.verify(token, secret) as PreferencesPayload
    if (payload.scope !== "preferences" || !payload.email) return null
    return payload.email
  } catch {
    return null
  }
}
