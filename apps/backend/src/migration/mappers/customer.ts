import type { LegacyAddress, LegacyCustomer } from "../types"

export interface MappedCustomer {
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  addresses: MappedAddress[]
  metadata: {
    migrated_from: "lehena-wp"
    migrated_at: string
    legacy_id: number
    /**
     * Marketing opt-in is carried over conservatively — anything not
     * explicit-yes maps to `false` so we don't email re-imported folks who
     * never agreed. RGPD-friendly default.
     */
    newsletter_marketing: boolean
  }
}

export interface MappedAddress {
  first_name: string | null
  last_name: string | null
  company: string | null
  address_1: string
  address_2: string | null
  city: string
  postal_code: string
  province: string | null
  country_code: string
  phone: string | null
  is_default_billing: boolean
  is_default_shipping: boolean
}

export function mapCustomer(c: LegacyCustomer): MappedCustomer | null {
  if (!c.email || !c.email.includes("@")) return null

  const addresses: MappedAddress[] = []
  if (c.billing && isAddressUsable(c.billing)) {
    addresses.push(addressToMedusa(c.billing, c, "billing"))
  }
  if (c.shipping && isAddressUsable(c.shipping)) {
    // Skip if identical to billing — Medusa keeps a flat list, no need to
    // duplicate.
    const sameAsBilling = addresses[0] && sameAddress(addresses[0], c.shipping)
    if (!sameAsBilling) {
      addresses.push(addressToMedusa(c.shipping, c, "shipping"))
    }
  }

  return {
    email: c.email.toLowerCase(),
    first_name: c.first_name,
    last_name: c.last_name,
    phone: c.phone,
    addresses,
    metadata: {
      migrated_from: "lehena-wp",
      migrated_at: new Date().toISOString(),
      legacy_id: c.id,
      newsletter_marketing: c.marketing_opt_in === true,
    },
  }
}

function isAddressUsable(a: LegacyAddress): boolean {
  return Boolean(a.address_1 && a.city && a.postcode && a.country)
}

function addressToMedusa(
  a: LegacyAddress,
  c: LegacyCustomer,
  kind: "billing" | "shipping"
): MappedAddress {
  return {
    first_name: a.first_name ?? c.first_name,
    last_name: a.last_name ?? c.last_name,
    company: a.company,
    address_1: a.address_1!,
    address_2: a.address_2,
    city: a.city!,
    postal_code: a.postcode!,
    province: a.state,
    country_code: (a.country ?? "FR").toLowerCase(),
    phone: a.phone ?? c.phone,
    is_default_billing: kind === "billing",
    is_default_shipping: kind === "shipping" || true,
  }
}

function sameAddress(a: MappedAddress, b: LegacyAddress): boolean {
  return (
    a.address_1 === b.address_1 &&
    a.postal_code === b.postcode &&
    a.city === b.city
  )
}
