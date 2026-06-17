import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Panier",
  description: "Votre panier — Maison Lehena.",
  robots: { index: false, follow: true },
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} />
}
