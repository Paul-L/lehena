"use client"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { type HttpTypes } from "@medusajs/types"
import { useToggleState } from "@medusajs/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"

import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import StepHeading from "../step-heading"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  const done = !isOpen && Boolean(cart?.shipping_address)

  return (
    <section style={{ borderTop: "1px solid var(--line)", paddingTop: 24 }}>
      <StepHeading
        num={1}
        label="Livraison"
        done={done}
        active={isOpen}
        onEdit={handleEdit}
        editTestId="edit-address-button"
      />
      {isOpen ? (
        <form action={formAction}>
          <div style={{ paddingLeft: 44, paddingBottom: 8 }}>
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsBilling && (
              <div style={{ marginTop: 32 }}>
                <div className="eyebrow" style={{ marginBottom: 18 }}>
                  Adresse de facturation
                </div>
                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton
              className="mt-6"
              data-testid="submit-address-button"
            >
              Continuer vers la livraison
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div style={{ paddingLeft: 44, marginTop: 8 }}>
          {cart && cart.shipping_address ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
                fontFamily: "var(--serif)",
                fontSize: 15,
                color: "var(--ink-soft)",
                lineHeight: 1.5,
              }}
            >
              <div data-testid="shipping-address-summary">
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Adresse de livraison
                </div>
                <div>
                  {cart.shipping_address.first_name}{" "}
                  {cart.shipping_address.last_name}
                </div>
                <div>
                  {cart.shipping_address.address_1}{" "}
                  {cart.shipping_address.address_2}
                </div>
                <div>
                  {cart.shipping_address.postal_code},{" "}
                  {cart.shipping_address.city}
                </div>
                <div>{cart.shipping_address.country_code?.toUpperCase()}</div>
              </div>

              <div data-testid="shipping-contact-summary">
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Contact
                </div>
                <div>{cart.shipping_address.phone}</div>
                <div>{cart.email}</div>
              </div>

              <div data-testid="billing-address-summary">
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Adresse de facturation
                </div>
                {sameAsBilling ? (
                  <div>Identique à l&apos;adresse de livraison.</div>
                ) : (
                  <>
                    <div>
                      {cart.billing_address?.first_name}{" "}
                      {cart.billing_address?.last_name}
                    </div>
                    <div>
                      {cart.billing_address?.address_1}{" "}
                      {cart.billing_address?.address_2}
                    </div>
                    <div>
                      {cart.billing_address?.postal_code},{" "}
                      {cart.billing_address?.city}
                    </div>
                    <div>
                      {cart.billing_address?.country_code?.toUpperCase()}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      )}
    </section>
  )
}

export default Addresses
