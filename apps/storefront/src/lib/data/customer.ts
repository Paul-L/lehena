"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { type HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await transferCart()

    return createdCustomer
  } catch (error: any) {
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
      })
  } catch (error: any) {
    return error.toString()
  }

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

/**
 * Triggers a password reset email for the given email. Medusa emits the
 * `auth.password_reset` event with a 15-minute JWT; the backend subscriber
 * logs (Phase 6) or emails (Phase 7) the link.
 *
 * Always returns success even if the email isn't on file — we don't want to
 * leak account existence via this endpoint.
 */
export async function requestPasswordReset(email: string) {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Email invalide." }
  }
  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
  } catch (err) {
    // Swallow "user not found" so we don't leak account existence. Any other
    // error gets logged server-side via medusaError().
    if (!(err instanceof Error) || !/not found/i.test(err.message)) {
      medusaError(err)
    }
  }
  return { success: true }
}

/**
 * Sets a new password given the JWT token issued by the reset flow.
 */
export async function resetPassword(token: string, password: string) {
  if (!token || token.length < 10) {
    return { success: false, error: "Lien invalide." }
  }
  if (password.length < 10) {
    return {
      success: false,
      error: "Le mot de passe doit faire au moins 10 caractères.",
    }
  }
  try {
    await sdk.auth.updateProvider("customer", "emailpass", { password }, token)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Impossible de réinitialiser le mot de passe.",
    }
  }
}

/**
 * Requests a magic-link.
 *
 * Two flows via un seul endpoint :
 *   - **Login existant** : appelle avec `(email)` seul. Le backend renvoie
 *     un 200 constant-time quel que soit le résultat pour ne pas révéler
 *     l'existence du compte (anti-énumération).
 *   - **Signup passwordless** : appelle avec `(email, { first_name, last_name })`.
 *     Le backend crée le customer + l'auth identity avant d'émettre l'event
 *     magic-link. Si l'email existait déjà, on retombe silencieusement sur
 *     le comportement login.
 */
export async function requestMagicLink(
  email: string,
  meta?: { first_name?: string; last_name?: string }
) {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Email invalide." }
  }
  try {
    await sdk.client.fetch<{ success: boolean }>("/store/auth/magic-link", {
      method: "POST",
      body: {
        email,
        ...(meta?.first_name ? { first_name: meta.first_name } : {}),
        ...(meta?.last_name ? { last_name: meta.last_name } : {}),
      },
    })
  } catch {
    // Swallow — we report success either way.
  }
  return { success: true }
}

/**
 * Trades a magic-link token for a regular Medusa session JWT. Sets the auth
 * cookie on success.
 */
export async function verifyMagicLink(token: string) {
  if (!token || token.length < 20) {
    return { success: false, error: "Lien invalide." }
  }
  try {
    const { token: sessionToken } = await sdk.client.fetch<{ token: string }>(
      "/store/auth/magic-link/verify",
      {
        method: "POST",
        body: { token },
      }
    )
    await setAuthToken(sessionToken)
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    await transferCart()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lien expiré ou invalide.",
    }
  }
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
