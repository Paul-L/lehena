"use client"

import { addCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { Plus } from "@medusajs/icons"
import { type HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import { useEffect, useState, useActionState } from "react"

const AddAddress = ({
  region,
  addresses,
}: {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
}) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(addCustomerAddress, {
    isDefaultShipping: addresses.length === 0,
    success: false,
    error: null,
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

  return (
    <>
      <button
        type="button"
        onClick={open}
        data-testid="add-address-button"
        style={{
          border: "1px dashed var(--line-strong)",
          padding: 28,
          background: "transparent",
          color: "var(--ink-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          minHeight: 260,
          fontFamily: "var(--serif)",
          fontSize: 15,
          fontStyle: "italic",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <Plus /> Nouvelle adresse
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>Ajouter une adresse</Modal.Title>
        <form action={formAction}>
          <Modal.Body>
            <div className="flex flex-col gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label="Prénom"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  data-testid="first-name-input"
                />
                <Input
                  label="Nom"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label="Société"
                name="company"
                autoComplete="organization"
                data-testid="company-input"
              />
              <Input
                label="Adresse"
                name="address_1"
                required
                autoComplete="address-line1"
                data-testid="address-1-input"
              />
              <Input
                label="Complément (bât., étage…)"
                name="address_2"
                autoComplete="address-line2"
                data-testid="address-2-input"
              />
              <div className="grid grid-cols-[144px_1fr] gap-x-2">
                <Input
                  label="Code postal"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  data-testid="postal-code-input"
                />
                <Input
                  label="Ville"
                  name="city"
                  required
                  autoComplete="locality"
                  data-testid="city-input"
                />
              </div>
              <Input
                label="Région"
                name="province"
                autoComplete="address-level1"
                data-testid="state-input"
              />
              <CountrySelect
                region={region}
                name="country_code"
                required
                autoComplete="country"
                data-testid="country-select"
              />
              <Input
                label="Téléphone"
                name="phone"
                autoComplete="phone"
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div
                className="py-2"
                style={{ color: "var(--rouge)", fontFamily: "var(--serif)", fontSize: 14 }}
                data-testid="address-error"
              >
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <button
                type="reset"
                onClick={close}
                className="btn btn-ghost"
                data-testid="cancel-button"
              >
                Annuler
              </button>
              <SubmitButton data-testid="save-button">Enregistrer</SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default AddAddress
