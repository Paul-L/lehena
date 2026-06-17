"use client"

import { useSearchParams } from "next/navigation"

import PaymentButton from "../payment-button"
import StepHeading from "../step-heading"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <section style={{ borderTop: "1px solid var(--line)", paddingTop: 24 }}>
      <StepHeading num={4} label="Récapitulatif" active={isOpen} locked={!isOpen} />
      {isOpen && previousStepsCompleted && (
        <div style={{ paddingLeft: 44 }}>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--ink-soft)",
              marginBottom: 22,
            }}
          >
            En validant la commande, vous confirmez avoir lu et accepté nos
            conditions générales de vente, notre politique de retours et notre
            politique de conservation de la chaîne du froid.
          </p>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </div>
      )}
    </section>
  )
}

export default Review
