"use client"

import { updateCustomer } from "@lib/data/customer"
import { type HttpTypes } from "@medusajs/types"
import { Button, Switch, Text, toast } from "@medusajs/ui"
import { useState } from "react"

interface Props {
  customer: HttpTypes.StoreCustomer
}

const KEY_MARKETING = "newsletter_marketing"
const KEY_RECIPES = "newsletter_recipes"
const KEY_DOB = "date_of_birth"

const bool = (v: unknown, fallback: boolean): boolean =>
  typeof v === "boolean" ? v : fallback

/**
 * Toggle which non-transactional emails the customer wants to receive.
 * Persists in `customer.metadata` to avoid an extra DB schema for V1; a
 * future custom-notifications module (Phase 7) can migrate the keys.
 *
 * Transactional emails (orders, shipments, password reset, account
 * security) are not user-toggleable — legally and operationally required.
 */
export default function NewsletterPreferences({ customer }: Props) {
  const metadata = (customer.metadata as Record<string, unknown> | null) ?? {}
  const [marketing, setMarketing] = useState(
    bool(metadata[KEY_MARKETING], true)
  )
  const [recipes, setRecipes] = useState(bool(metadata[KEY_RECIPES], false))
  const [dob, setDob] = useState(
    typeof metadata[KEY_DOB] === "string" ? (metadata[KEY_DOB] as string) : ""
  )
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateCustomer({
        metadata: {
          ...metadata,
          [KEY_MARKETING]: marketing,
          [KEY_RECIPES]: recipes,
          [KEY_DOB]: dob || null,
        },
      })
      toast.success("Préférences enregistrées.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de sauvegarder."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-8 max-w-2xl">
      <section className="flex flex-col gap-y-4">
        <h2 className="text-base-semi">Newsletter</h2>
        <div className="flex items-start justify-between gap-4 py-3 border-t border-ui-border-base">
          <div>
            <Text className="text-ui-fg-base">Offres & nouveautés</Text>
            <Text size="small" className="text-ui-fg-subtle">
              Lancements de produits, événements, ventes privées (~2 emails /
              mois).
            </Text>
          </div>
          <Switch
            checked={marketing}
            onCheckedChange={setMarketing}
            data-testid="pref-marketing-toggle"
          />
        </div>
        <div className="flex items-start justify-between gap-4 py-3 border-t border-ui-border-base">
          <div>
            <Text className="text-ui-fg-base">Recettes & accords</Text>
            <Text size="small" className="text-ui-fg-subtle">
              Idées d&apos;accords, recettes de saison, contenus longs (1 email
              / mois).
            </Text>
          </div>
          <Switch
            checked={recipes}
            onCheckedChange={setRecipes}
            data-testid="pref-recipes-toggle"
          />
        </div>
        <div className="flex items-start justify-between gap-4 py-3 border-t border-b border-ui-border-base">
          <div>
            <Text className="text-ui-fg-base">Commandes & expéditions</Text>
            <Text size="small" className="text-ui-fg-subtle">
              Confirmation de commande, suivi colis, factures. Non désactivable.
            </Text>
          </div>
          <Switch
            checked
            disabled
            aria-label="Transactionnel — non désactivable"
          />
        </div>
      </section>

      <section className="flex flex-col gap-y-2">
        <h2 className="text-base-semi">Date de naissance (optionnelle)</h2>
        <Text size="small" className="text-ui-fg-subtle">
          Pour recevoir une attention le jour de votre anniversaire. Aucune
          obligation.
        </Text>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="max-w-xs mt-2 px-3 py-2 border border-ui-border-base rounded text-sm"
          data-testid="pref-dob-input"
        />
      </section>

      <div>
        <Button onClick={save} isLoading={saving} data-testid="pref-save">
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
