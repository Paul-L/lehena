import { type HttpTypes } from "@medusajs/types"
import React from "react"

import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"

interface AddressBookProps {
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
}

const AddressBook: React.FC<AddressBookProps> = ({ customer, region }) => {
  const { addresses } = customer
  return (
    <div
      className="address-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
      }}
    >
      {addresses.map((address) => (
        <EditAddress region={region} address={address} key={address.id} />
      ))}
      <AddAddress region={region} addresses={addresses} />
    </div>
  )
}

export default AddressBook
