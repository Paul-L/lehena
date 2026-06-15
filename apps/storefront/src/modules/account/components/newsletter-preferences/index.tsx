"use client"

import { updateCustomer } from "@lib/data/customer"
import { type HttpTypes } from "@medusajs/types"
import { toast } from "@medusajs/ui"
import { useState } from "react"

interface Props {
  customer: HttpTypes.StoreCustomer
}

const KEY_MARKETING = "newsletter_marketing"
const KEY_RECIPES = "newsletter_recipes"
const KEY_DOB = "date_of_birth"

const bool = (v: unknown, fallback: boolean): boolean =>
  typeof v === "boolean" ? v : fallback

interface ToggleProps {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label: string
}

function Toggle({ id, checked, onChange, disabled, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      data-testid={id}
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        background: checked
          ? disabled
            ? "var(--line-strong)"
            : "var(--rouge)"
          : "var(--line-strong)",
        position: "relative",
        border: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 200ms ease",
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 22 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--bg)",
          transition: "left 200ms cubic-bezier(0.32, 0.72, 0.2, 1)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  )
}

interface ItemProps {
  title: string
  desc: string
  toggle: React.ReactNode
}

function PrefRow({ title, desc, toggle }: ItemProps) {
  return (
    <li style={{ borderTop: "1px solid var(--line)", padding: "22px 0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--serif-display)",
              fontSize: 20,
              fontStyle: "italic",
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 14.5,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
              maxWidth: 540,
            }}
          >
            {desc}
          </div>
        </div>
        {toggle}
      </div>
    </li>
  )
}

export default function NewsletterPreferences({ customer }: Props) {
  const metadata = (customer.metadata as Record<string, unknown> | null) ?? {}
  const [marketing, setMarketing] = useState(bool(metadata[KEY_MARKETING], true))
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
    <div>
      {/* Coordonnées */}
      <section
        style={{
          padding: "28px 0",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          marginBottom: 32,
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 18 }}>
          Coordonnées
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-mute)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Email
            </div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 17 }}>
              {customer.email}
            </div>
          </div>
          <div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-mute)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Téléphone
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 17,
                color: customer.phone ? "var(--ink)" : "var(--ink-soft)",
                fontStyle: customer.phone ? "normal" : "italic",
              }}
            >
              {customer.phone || "Non renseigné"}
            </div>
          </div>
        </div>
      </section>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        <PrefRow
          title="Offres & nouveautés"
          desc="Lancements de produits, événements, ventes privées (~2 emails / mois)."
          toggle={
            <Toggle
              id="pref-marketing-toggle"
              checked={marketing}
              onChange={setMarketing}
              label="Offres & nouveautés"
            />
          }
        />
        <PrefRow
          title="Recettes & accords"
          desc="Idées d'accords, recettes de saison, contenus longs (1 email / mois)."
          toggle={
            <Toggle
              id="pref-recipes-toggle"
              checked={recipes}
              onChange={setRecipes}
              label="Recettes & accords"
            />
          }
        />
        <PrefRow
          title="Commandes & expéditions"
          desc="Confirmation de commande, suivi colis, factures. Non désactivable."
          toggle={
            <Toggle
              id="pref-transactional-toggle"
              checked
              onChange={() => undefined}
              disabled
              label="Transactionnel — non désactivable"
            />
          }
        />
      </ul>

      <section
        style={{
          marginTop: 32,
          paddingTop: 28,
          borderTop: "1px solid var(--line)",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Date de naissance (optionnelle)
        </div>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 14,
            color: "var(--ink-soft)",
            margin: "0 0 14px",
            lineHeight: 1.5,
          }}
        >
          Pour recevoir une attention le jour de votre anniversaire. Aucune
          obligation.
        </p>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          data-testid="pref-dob-input"
          style={{
            border: 0,
            borderBottom: "1px solid var(--ink)",
            background: "transparent",
            padding: "8px 0",
            fontFamily: "var(--serif)",
            fontSize: 16,
            color: "var(--ink)",
            outline: "none",
            maxWidth: 220,
          }}
        />
      </section>

      <div
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={save}
          disabled={saving}
          data-testid="pref-save"
          className="btn btn-rouge"
          style={{ padding: "12px 22px", fontSize: 11 }}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  )
}
