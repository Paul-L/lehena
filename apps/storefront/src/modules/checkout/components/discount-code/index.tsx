"use client"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { type HttpTypes } from "@medusajs/types"
import { Badge } from "@medusajs/ui"
import Trash from "@modules/common/icons/trash"
import React from "react"

import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

interface DiscountCodeProps {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e: any) {
      setErrorMessage(e.message)
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <div>
        <form action={(a) => addPromotionCode(a)} style={{ width: "100%" }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--rouge)",
              marginBottom: isOpen ? 12 : 0,
            }}
            data-testid="add-discount-button"
          >
            {isOpen ? "− Code promo" : "+ Ajouter un code promo"}
          </button>

          {isOpen && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="promotion-input"
                  name="code"
                  type="text"
                  autoFocus={false}
                  placeholder="Code promo"
                  data-testid="discount-input"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "1px solid var(--line-strong)",
                    background: "var(--bg)",
                    padding: "10px 12px",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    outline: "none",
                    color: "var(--ink)",
                  }}
                />
                <SubmitButton
                  variant="secondary"
                  data-testid="discount-apply-button"
                >
                  Appliquer
                </SubmitButton>
              </div>

              <ErrorMessage
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </>
          )}
        </form>

        {promotions.length > 0 && (
          <div style={{ width: "100%", marginTop: 14 }}>
            <div style={{ width: "100%" }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Promotion(s) appliquée(s)
              </div>

              {promotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full max-w-full mb-2"
                    data-testid="discount-row"
                  >
                    <span className="flex gap-x-1 items-baseline txt-small-plus w-4/5 pr-1" style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--ink-soft)" }}>
                      <span className="truncate" data-testid="discount-code">
                        <Badge
                          color={promotion.is_automatic ? "green" : "grey"}
                          size="small"
                        >
                          {promotion.code}
                        </Badge>{" "}
                        (
                        {promotion.application_method?.value !== undefined &&
                          promotion.application_method.currency_code !==
                            undefined && (
                            <>
                              {promotion.application_method.type ===
                              "percentage"
                                ? `${promotion.application_method.value}%`
                                : convertToLocale({
                                    amount: +promotion.application_method.value,
                                    currency_code:
                                      promotion.application_method
                                        .currency_code,
                                  })}
                            </>
                          )}
                        )
                        {/* {promotion.is_automatic && (
                          <Tooltip content="This promotion is automatically applied">
                            <InformationCircleSolid className="inline text-zinc-400" />
                          </Tooltip>
                        )} */}
                      </span>
                    </span>
                    {!promotion.is_automatic && (
                      <button
                        className="flex items-center"
                        onClick={() => {
                          if (!promotion.code) {
                            return
                          }

                          removePromotionCode(promotion.code)
                        }}
                        data-testid="remove-discount-button"
                      >
                        <Trash size={14} />
                        <span className="sr-only">
                          Retirer le code promo de la commande
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
