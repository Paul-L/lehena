import type { ProductDetailsCatalog } from "@lib/data/product-details"

interface Props {
  details: ProductDetailsCatalog
}

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: "Gluten",
  crustaces: "Crustacés",
  oeufs: "Œufs",
  poissons: "Poissons",
  arachides: "Arachides",
  soja: "Soja",
  lait: "Lait et lactose",
  fruits_coques: "Fruits à coque",
  celeri: "Céleri",
  moutarde: "Moutarde",
  sesame: "Sésame",
  sulfites: "Sulfites",
  lupin: "Lupin",
  mollusques: "Mollusques",
}

interface NutritionRow {
  label: string
  /** g per 100 g, or kcal/kJ for energy. */
  value: number
  unit: string
}

function rows(
  nut: NonNullable<ProductDetailsCatalog["nutritional"]>
): NutritionRow[] {
  const out: NutritionRow[] = []
  if (nut.energy_kj || nut.energy_kcal) {
    const parts = [
      nut.energy_kj ? `${nut.energy_kj} kJ` : null,
      nut.energy_kcal ? `${nut.energy_kcal} kcal` : null,
    ]
      .filter(Boolean)
      .join(" · ")
    out.push({ label: "Énergie", value: 0, unit: parts })
  }
  if (nut.fat !== undefined)
    out.push({ label: "Matières grasses", value: nut.fat, unit: "g" })
  if (nut.fat_saturated !== undefined)
    out.push({
      label: "  dont saturées",
      value: nut.fat_saturated,
      unit: "g",
    })
  if (nut.carbs !== undefined)
    out.push({ label: "Glucides", value: nut.carbs, unit: "g" })
  if (nut.sugars !== undefined)
    out.push({ label: "  dont sucres", value: nut.sugars, unit: "g" })
  if (nut.fiber !== undefined)
    out.push({ label: "Fibres", value: nut.fiber, unit: "g" })
  if (nut.protein !== undefined)
    out.push({ label: "Protéines", value: nut.protein, unit: "g" })
  if (nut.salt !== undefined)
    out.push({ label: "Sel", value: nut.salt, unit: "g" })
  return out
}

export default function LehenaPDPNutritional({ details }: Props) {
  const nutRows = details.nutritional ? rows(details.nutritional) : []
  const allergens = (details.allergens ?? [])
    .map((a) => ALLERGEN_LABELS[a] ?? a)
    .filter(Boolean)
  const hasNutrition = nutRows.length > 0
  const hasIngredients = Boolean(details.ingredients)
  const hasAllergens = allergens.length > 0

  if (!hasNutrition && !hasIngredients && !hasAllergens) return null

  return (
    <section
      className="reveal"
      aria-labelledby="pdp-nutri-heading"
      style={{
        padding: "clamp(64px, 12vw, 120px) 0",
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div className="lh-wrap">
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          Étiquette
        </div>
        <h2
          id="pdp-nutri-heading"
          className="serif-display"
          style={{
            fontSize: "var(--step-4)",
            lineHeight: 1,
            marginBottom: 36,
          }}
        >
          Ingrédients,{" "}
          <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
            nutrition & allergènes.
          </em>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: hasNutrition ? "1.2fr 1fr" : "1fr",
            gap: 56,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {hasIngredients ? (
              <div>
                <div
                  className="eyebrow"
                  style={{
                    color: "var(--ink-mute)",
                    marginBottom: 10,
                  }}
                >
                  Ingrédients
                </div>
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "var(--ink-soft)",
                    margin: 0,
                  }}
                >
                  {details.ingredients}
                </p>
              </div>
            ) : null}

            {hasAllergens ? (
              <div>
                <div
                  className="eyebrow"
                  style={{
                    color: "var(--ink-mute)",
                    marginBottom: 10,
                  }}
                >
                  Allergènes
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {allergens.map((a) => (
                    <li key={a}>
                      <span
                        className="chip"
                        style={{ background: "var(--bg)" }}
                      >
                        {a}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {hasNutrition ? (
            <div>
              <div
                className="eyebrow"
                style={{
                  color: "var(--ink-mute)",
                  marginBottom: 14,
                }}
              >
                Valeurs nutritionnelles · pour 100 g
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "var(--serif)",
                  fontSize: 14,
                }}
              >
                <tbody>
                  {nutRows.map((row) => (
                    <tr key={row.label}>
                      <td
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px solid var(--line)",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {row.label}
                      </td>
                      <td
                        style={{
                          padding: "10px 0",
                          textAlign: "right",
                          borderBottom: "1px solid var(--line)",
                          fontFamily: "var(--mono)",
                          fontSize: 12,
                          color: "var(--ink)",
                        }}
                      >
                        {row.unit.includes("kJ") || row.unit.includes("kcal")
                          ? row.unit
                          : `${row.value} ${row.unit}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
