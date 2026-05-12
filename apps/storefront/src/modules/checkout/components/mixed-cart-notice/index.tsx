import { Snowflake } from "lucide-react"

interface Props {
  /** Set to true when cart contains fresh + ambient items. */
  isMixed: boolean
}

/**
 * Banner shown at the top of the shipping step when the cart contains both
 * fresh (Chronofresh-only) and ambient items. Explains to the customer why
 * we force the cold chain across the whole order.
 */
export default function MixedCartNotice({ isMixed }: Props) {
  if (!isMixed) return null
  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "12px 14px",
        marginBottom: 16,
        background: "var(--bg-elevated, #f7f4ee)",
        border: "1px solid var(--line, #e7e1d5)",
        borderLeft: "3px solid var(--rouge, #b3402a)",
        fontFamily: "var(--serif, Georgia, serif)",
        fontSize: 14,
        color: "var(--ink, #2a1f17)",
        lineHeight: 1.5,
      }}
    >
      <Snowflake size={16} aria-hidden="true" style={{ marginTop: 2 }} />
      <div>
        <strong>Votre panier contient des produits frais et secs.</strong>{" "}
        L&rsquo;ensemble sera expédié en chaîne du froid Chronofresh dans un
        seul colis réfrigéré. La livraison sèche Colissimo n&rsquo;est pas
        disponible pour cette commande.
      </div>
    </div>
  )
}
