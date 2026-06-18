"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethods } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import {
  classifyCartProfiles,
  filterShippingOptionsForCart,
  requiredShippingProfileIds,
  resolveCoveringOptionIds,
} from "@lib/util/shipping-rules"
import { Loader } from "@medusajs/icons"
import { type HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import MixedCartNotice from "@modules/checkout/components/mixed-cart-notice"
import StepHeading from "@modules/checkout/components/step-heading"
import MedusaRadio from "@modules/common/components/radio"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

interface ShippingProps {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  // Detect mixed cart (fresh + ambient) so we can force the cold chain and
  // hide Colissimo options entirely. See `lib/util/shipping-rules.ts`.
  const profiles = useMemo(
    () =>
      classifyCartProfiles(
        (cart.items ?? []) as Parameters<typeof classifyCartProfiles>[0]
      ),
    [cart.items]
  )

  const requiredProfileIds = useMemo(
    () =>
      requiredShippingProfileIds(
        (cart.items ?? []) as Parameters<typeof requiredShippingProfileIds>[0]
      ),
    [cart.items]
  )

  const _rawShippingMethods = availableShippingMethods?.filter(
    (sm) =>
      (
        sm as unknown as {
          service_zone?: { fulfillment_set?: { type?: string } }
        }
      ).service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _shippingMethods = useMemo(
    () =>
      filterShippingOptionsForCart(_rawShippingMethods ?? [], {
        isMixed: profiles.is_mixed,
        requiredProfileIds,
      }),
    [_rawShippingMethods, profiles.is_mixed, requiredProfileIds]
  )

  // Pickup options are exposed by the backend on BOTH shipping profiles
  // (fresh + ambient) so any cart — including a mixed jambon + accessoire
  // cart — can be collected. Keep only those the cart actually requires,
  // otherwise a fresh-only cart would also list the ambient pickup and
  // selecting it would fail completion ("profiles not satisfied"). Fall back
  // to all when profiles aren't expanded.
  const _pickupMethods = availableShippingMethods
    ?.filter(
      (sm) =>
        (
          sm as unknown as {
            service_zone?: { fulfillment_set?: { type?: string } }
          }
        ).service_zone?.fulfillment_set?.type === "pickup"
    )
    ?.filter(
      (sm) =>
        requiredProfileIds.size === 0 ||
        (sm.shipping_profile_id != null &&
          requiredProfileIds.has(sm.shipping_profile_id))
    )

  const hasPickupOptions = !!_pickupMethods?.length

  // One physical store backs several pickup options (one per profile).
  // Collapse to unique locations for display; selecting a location sets a
  // pickup method for every required profile (see handleSelectPickup).
  const _pickupLocations = (() => {
    const seen = new Set<string>()
    const out: NonNullable<typeof _pickupMethods> = []
    for (const m of _pickupMethods ?? []) {
      const setId =
        (
          m as unknown as {
            service_zone?: { fulfillment_set?: { id?: string } }
          }
        ).service_zone?.fulfillment_set?.id ?? m.id
      if (seen.has(setId)) continue
      seen.add(setId)
      out.push(m)
    }
    return out
  })()

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    // Cover EVERY required shipping profile in a single bulk call. Pickup sets
    // all (already profile-filtered) pickup methods; delivery sets the picked
    // option plus, for a mixed cart, its same-carrier sibling for the other
    // profile (e.g. Chronofresh France + Chronofresh France (mixed)).
    let optionIds: string[]
    if (variant === "pickup") {
      optionIds = (_pickupMethods ?? []).map((m) => m.id)
    } else {
      const option = (availableShippingMethods ?? []).find((o) => o.id === id)
      optionIds = option
        ? resolveCoveringOptionIds(
            option,
            availableShippingMethods ?? [],
            requiredProfileIds
          )
        : [id]
    }
    if (optionIds.length === 0) {
      optionIds = [id]
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethods({ cartId: cart.id, optionIds })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // In-store pickup. `_pickupMethods` is already filtered to the cart's
  // required profiles, so for a single-profile cart this sets the one correct
  // (right-profile) pickup method. NB: like delivery, the store endpoint keeps
  // a single shipping method, so a *mixed* cart can't cover both profiles —
  // a pre-existing platform limitation tracked separately.
  const handleSelectPickup = async () => {
    const id = _pickupMethods?.find((m) => !m.insufficient_inventory)?.id
    if (id) {
      await handleSetShippingMethod(id, "pickup")
    } else {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const done = !isOpen && (cart.shipping_methods?.length ?? 0) > 0
  const locked = !isOpen && cart.shipping_methods?.length === 0

  const cardStyle = (
    selected: boolean,
    disabled = false
  ): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: 16,
    marginBottom: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    border: selected ? "1px solid var(--ink)" : "1px solid var(--line)",
    background: selected ? "var(--bg-elevated)" : "transparent",
    opacity: disabled ? 0.5 : 1,
    transition: "all 160ms ease",
  })
  const methodLabelStyle: React.CSSProperties = {
    fontFamily: "var(--serif-display)",
    fontStyle: "italic",
    fontSize: 18,
  }
  const priceStyle: React.CSSProperties = {
    fontFamily: "var(--serif)",
    fontSize: 16,
    whiteSpace: "nowrap",
  }

  // Description + délai dérivés du nom du transporteur (sans date fabriquée).
  const describeOption = (
    name?: string | null
  ): { desc?: string; eta?: string } => {
    const n = (name ?? "").toLowerCase()
    if (n.includes("express") || n.includes("j+1") || n.includes("13h"))
      return {
        desc: "Livraison réfrigérée le lendemain matin.",
        eta: "J+1 avant 13 h",
      }
    if (
      n.includes("chronofresh") ||
      n.includes("frais") ||
      n.includes("réfrig")
    )
      return {
        desc: "Livraison réfrigérée à domicile, jours ouvrés.",
        eta: "24–48 h",
      }
    if (n.includes("colissimo") || n.includes("poste"))
      return { desc: "Colis suivi La Poste, à domicile.", eta: "48–72 h" }
    if (n.includes("relais") || n.includes("pickup") || n.includes("point"))
      return { desc: "Retrait dans un point partenaire.", eta: "sous 48 h" }
    return {}
  }
  const descStyle: React.CSSProperties = {
    fontFamily: "var(--serif)",
    fontSize: 13.5,
    color: "var(--ink-soft)",
    lineHeight: 1.4,
    marginTop: 3,
  }
  const etaStyle: React.CSSProperties = {
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--rouge)",
    marginTop: 6,
  }

  return (
    <section style={{ borderTop: "1px solid var(--line)", paddingTop: 24 }}>
      <StepHeading
        num={2}
        label="Mode d'envoi"
        done={done}
        active={isOpen}
        locked={locked}
        onEdit={
          cart?.shipping_address && cart?.billing_address && cart?.email
            ? handleEdit
            : undefined
        }
        editTestId="edit-delivery-button"
      />
      {isOpen ? (
        <div style={{ paddingLeft: 44 }}>
          <MixedCartNotice isMixed={profiles.is_mixed} />
          <div className="grid">
            <div className="flex flex-col">
              <span className="eyebrow" style={{ marginBottom: 14 }}>
                Mode de livraison
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={() => handleSelectPickup()}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      style={cardStyle(showPickupOptions === PICKUP_OPTION_ON)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <MedusaRadio
                          checked={showPickupOptions === PICKUP_OPTION_ON}
                        />
                        <span style={methodLabelStyle}>
                          Retirer votre commande
                        </span>
                      </div>
                      <span style={priceStyle}>—</span>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (v) {
                      return handleSetShippingMethod(v, "shipping")
                    }
                  }}
                >
                  {_shippingMethods?.map((option) => {
                    const isDisabled =
                      option.price_type === "calculated" &&
                      !isLoadingPrices &&
                      typeof calculatedPricesMap[option.id] !== "number"

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        disabled={isDisabled}
                        style={{
                          ...cardStyle(
                            option.id === shippingMethodId,
                            isDisabled
                          ),
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 14,
                          }}
                        >
                          <span style={{ marginTop: 2 }}>
                            <MedusaRadio
                              checked={option.id === shippingMethodId}
                            />
                          </span>
                          <div>
                            <span style={methodLabelStyle}>{option.name}</span>
                            {describeOption(option.name).desc && (
                              <div style={descStyle}>
                                {describeOption(option.name).desc}
                              </div>
                            )}
                            {describeOption(option.name).eta && (
                              <div style={etaStyle}>
                                Estimé · {describeOption(option.name).eta}
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          style={{
                            ...priceStyle,
                            color:
                              option.price_type === "flat" &&
                              option.amount === 0
                                ? "var(--olive)"
                                : "var(--ink)",
                          }}
                        >
                          {option.price_type === "flat" ? (
                            option.amount === 0 ? (
                              "Offerte"
                            ) : (
                              convertToLocale({
                                amount: option.amount!,
                                currency_code: cart?.currency_code,
                              })
                            )
                          ) : calculatedPricesMap[option.id] ? (
                            convertToLocale({
                              amount: calculatedPricesMap[option.id],
                              currency_code: cart?.currency_code,
                            })
                          ) : isLoadingPrices ? (
                            <Loader />
                          ) : (
                            "—"
                          )}
                        </span>
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="grid">
              <div className="flex flex-col">
                <span className="eyebrow" style={{ marginBottom: 14 }}>
                  Magasin
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-8 md:pt-0 pt-2">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={() => handleSelectPickup()}
                  >
                    {_pickupLocations.map((option) => {
                      const selected = showPickupOptions === PICKUP_OPTION_ON
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          style={{
                            ...cardStyle(
                              selected,
                              option.insufficient_inventory
                            ),
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 14,
                            }}
                          >
                            <MedusaRadio checked={selected} />
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <span style={methodLabelStyle}>
                                {option.name}
                              </span>
                              {(() => {
                                const pickupAddress = (
                                  option as unknown as {
                                    service_zone?: {
                                      fulfillment_set?: {
                                        location?: {
                                          address?: Parameters<
                                            typeof formatAddress
                                          >[0]
                                        }
                                      }
                                    }
                                  }
                                ).service_zone?.fulfillment_set?.location
                                  ?.address
                                if (!pickupAddress) return null
                                return (
                                  <span
                                    style={{
                                      fontFamily: "var(--serif)",
                                      fontSize: 13.5,
                                      color: "var(--ink-soft)",
                                      marginTop: 2,
                                    }}
                                  >
                                    {formatAddress(pickupAddress)}
                                  </span>
                                )
                              })()}
                            </div>
                          </div>
                          <span
                            style={{
                              ...priceStyle,
                              color:
                                option.amount === 0
                                  ? "var(--olive)"
                                  : "var(--ink)",
                            }}
                          >
                            {option.amount === 0
                              ? "Gratuit"
                              : convertToLocale({
                                  amount: option.amount!,
                                  currency_code: cart?.currency_code,
                                })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <button
              type="button"
              className="btn btn-solid"
              style={{
                justifyContent: "center",
                width: "100%",
                marginTop: 14,
                opacity: !cart.shipping_methods?.[0] || isLoading ? 0.45 : 1,
                cursor:
                  !cart.shipping_methods?.[0] || isLoading
                    ? "not-allowed"
                    : "pointer",
              }}
              onClick={handleSubmit}
              disabled={!cart.shipping_methods?.[0] || isLoading}
              data-testid="submit-delivery-option-button"
            >
              {isLoading ? "…" : "Continuer vers le paiement"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ paddingLeft: 44, marginTop: 8 }}>
          {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 15,
                color: "var(--ink-soft)",
              }}
            >
              {cart.shipping_methods!.at(-1)!.name}{" "}
              {convertToLocale({
                amount: cart.shipping_methods!.at(-1)!.amount!,
                currency_code: cart?.currency_code,
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default Shipping
