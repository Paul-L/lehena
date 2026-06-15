"use client"

import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { type HttpTypes } from "@medusajs/types"
import { Button, Heading } from "@medusajs/ui"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import Spinner from "@modules/common/icons/spinner"
import React, { useEffect, useState, useActionState } from "react"

interface EditAddressProps {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
}

const EditAddress: React.FC<EditAddressProps> = ({ region, address }) => {
  const [removing, setRemoving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(updateCustomerAddress, {
    success: false,
    error: null,
    addressId: address.id,
  })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  const removeAddress = async () => {
    setRemoving(true)
    await deleteCustomerAddress(address.id)
    setRemoving(false)
  }

  const isDefault = !!address.is_default_shipping
  const eyebrowLabel = address.company || (isDefault ? "Adresse principale" : "Adresse")

  return (
    <>
      <article
        data-testid="address-container"
        style={{
          border: "1px solid var(--line)",
          padding: 28,
          background: isDefault ? "var(--bg-elevated)" : "transparent",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          minHeight: 260,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div className="eyebrow">{eyebrowLabel}</div>
          {isDefault && (
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--rouge)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              ● Par défaut
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 16,
            lineHeight: 1.55,
            color: "var(--ink)",
            flex: 1,
          }}
        >
          <div
            style={{ fontWeight: 500 }}
            data-testid="address-name"
          >
            {address.first_name} {address.last_name}
          </div>
          <div data-testid="address-address">
            {address.address_1}
            {address.address_2 && `, ${address.address_2}`}
          </div>
          <div data-testid="address-postal-city">
            {address.postal_code} {address.city}
          </div>
          <div data-testid="address-province-country">
            {address.province && `${address.province}, `}
            {address.country_code?.toUpperCase()}
          </div>
          {address.phone && (
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                marginTop: 10,
                letterSpacing: "0.06em",
              }}
            >
              {address.phone}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: 22,
            paddingTop: 18,
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
            onClick={open}
            data-testid="address-edit-button"
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "underline",
            }}
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={removeAddress}
            disabled={removing}
            data-testid="address-delete-button"
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-mute)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "underline",
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {removing ? <Spinner /> : null} Supprimer
          </button>
        </div>
      </article>

      <Modal isOpen={state} close={close} data-testid="edit-address-modal">
        <Modal.Title>
          <Heading className="mb-2">Edit address</Heading>
        </Modal.Title>
        <form action={formAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <Modal.Body>
            <div className="grid grid-cols-1 gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label="First name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  defaultValue={address.first_name || undefined}
                  data-testid="first-name-input"
                />
                <Input
                  label="Last name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  defaultValue={address.last_name || undefined}
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label="Company"
                name="company"
                autoComplete="organization"
                defaultValue={address.company || undefined}
                data-testid="company-input"
              />
              <Input
                label="Address"
                name="address_1"
                required
                autoComplete="address-line1"
                defaultValue={address.address_1 || undefined}
                data-testid="address-1-input"
              />
              <Input
                label="Apartment, suite, etc."
                name="address_2"
                autoComplete="address-line2"
                defaultValue={address.address_2 || undefined}
                data-testid="address-2-input"
              />
              <div className="grid grid-cols-[144px_1fr] gap-x-2">
                <Input
                  label="Postal code"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  defaultValue={address.postal_code || undefined}
                  data-testid="postal-code-input"
                />
                <Input
                  label="City"
                  name="city"
                  required
                  autoComplete="locality"
                  defaultValue={address.city || undefined}
                  data-testid="city-input"
                />
              </div>
              <Input
                label="Province / State"
                name="province"
                autoComplete="address-level1"
                defaultValue={address.province || undefined}
                data-testid="state-input"
              />
              <CountrySelect
                name="country_code"
                region={region}
                required
                autoComplete="country"
                defaultValue={address.country_code || undefined}
                data-testid="country-select"
              />
              <Input
                label="Phone"
                name="phone"
                autoComplete="phone"
                defaultValue={address.phone || undefined}
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div className="text-rose-500 text-small-regular py-2">
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <Button
                type="reset"
                variant="secondary"
                onClick={close}
                className="h-10"
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <SubmitButton data-testid="save-button">Save</SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default EditAddress
