import LehenaCartButton from "@modules/layout/templates/nav/lehena-cart-button"
import LehenaHeader from "@modules/layout/templates/nav/lehena-header"

export default async function Nav() {
  return <LehenaHeader cartButton={<LehenaCartButton />} />
}
