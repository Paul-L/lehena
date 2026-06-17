"use client"

import { type HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Item from "@modules/cart/components/item"

interface ItemsTemplateProps {
  cart: HttpTypes.StoreCart
}

const ItemsPreviewTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart.items
  const hasOverflow = items && items.length > 4

  return (
    <div
      className={clx("lh-no-scrollbar", {
        "overflow-y-scroll overflow-x-hidden max-h-[420px]": hasOverflow,
      })}
      data-testid="items-table"
    >
      {items
        ?.sort((a, b) =>
          (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
        )
        .map((item) => (
          <Item
            key={item.id}
            item={item}
            type="preview"
            currencyCode={cart.currency_code}
          />
        ))}
    </div>
  )
}

export default ItemsPreviewTemplate
