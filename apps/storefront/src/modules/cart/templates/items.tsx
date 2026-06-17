import repeat from "@lib/util/repeat"
import { type HttpTypes } from "@medusajs/types"
import { Table } from "@medusajs/ui"
import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

interface ItemsTemplateProps {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  return (
    <div>
      <div className="pb-4 flex items-center">
        <h1 className="serif-display" style={{ fontSize: "var(--step-5)", lineHeight: 1 }}>
          Votre panier
        </h1>
      </div>
      <Table>
        <Table.Header className="border-t-0">
          <Table.Row className="eyebrow">
            <Table.HeaderCell className="!pl-0">Article</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>Quantité</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              Prix
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right">
              Total
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsTemplate
