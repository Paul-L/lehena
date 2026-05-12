"use server"

import { sdk } from "@lib/config"

import { getAuthHeaders } from "./cookies"
import { signout } from "./customer"

interface ExportEnvelope {
  exported_at: string
  customer: Record<string, unknown>
  addresses: unknown[]
  orders: unknown[]
  wishlist: unknown[]
  gdpr_history: unknown[]
  notice: string
}

export async function exportMyData(): Promise<ExportEnvelope> {
  const headers = await getAuthHeaders()
  if (!headers) throw new Error("Not authenticated")
  return sdk.client.fetch<ExportEnvelope>("/store/customers/me/gdpr/export", {
    headers,
  })
}

export async function requestDelete(input: {
  password: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()
  if (!headers) return { success: false, error: "Non connecté." }
  try {
    await sdk.client.fetch("/store/customers/me/gdpr/delete-request", {
      method: "POST",
      headers,
      body: input,
    })
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau.",
    }
  }
}

export async function confirmDelete(
  token: string,
  countryCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sdk.client.fetch("/store/customers/me/gdpr/delete-confirm", {
      method: "POST",
      body: { token },
    })
    // Sign the user out so the next page load shows the public site.
    await signout(countryCode)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau.",
    }
  }
}
