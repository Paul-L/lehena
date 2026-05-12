"use client"

import { setLineItemGiftMessage } from "@lib/data/cart"
import { Gift } from "lucide-react"
import { useState } from "react"

interface Props {
  lineId: string
  initial?: string | null
  type?: "full" | "preview"
}

const MAX = 200

/**
 * Per-line-item gift message editor. Collapsed by default. Saves to line item
 * metadata so the admin sees it on the order, and so the workflow that prints
 * the gift card can pick it up.
 */
export default function GiftMessage({ lineId, initial, type = "full" }: Props) {
  const [open, setOpen] = useState(Boolean(initial))
  const [value, setValue] = useState(initial ?? "")
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  if (type === "preview") {
    // In the mini-cart drawer we just show a read-only badge when set.
    if (!initial) return null
    return (
      <div
        className="mono"
        style={{
          marginTop: 6,
          fontSize: 10,
          letterSpacing: "0.08em",
          color: "var(--ink-mute)",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Gift size={11} /> MESSAGE CADEAU
      </div>
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      await setLineItemGiftMessage({ lineId, message: value })
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            color: "var(--ink-mute)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
        >
          <Gift size={11} /> AJOUTER UN MESSAGE CADEAU
        </button>
      ) : (
        <div style={{ display: "grid", gap: 6, maxWidth: 420 }}>
          <label
            htmlFor={`gm-${lineId}`}
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--ink-mute)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Gift size={11} /> MESSAGE CADEAU{" "}
            <span style={{ color: "var(--ink-mute)" }}>
              ({value.length}/{MAX})
            </span>
          </label>
          <textarea
            id={`gm-${lineId}`}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX))}
            placeholder="Joyeux anniversaire, Maman."
            rows={3}
            maxLength={MAX}
            style={{
              fontFamily: "var(--serif)",
              fontSize: 14,
              padding: 8,
              border: "1px solid var(--line)",
              background: "var(--bg)",
              color: "var(--ink)",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: "6px 12px",
                background: "var(--ink)",
                color: "var(--bg)",
                border: 0,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "ENREGISTREMENT…" : "ENREGISTRER"}
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("")
                setOpen(false)
                setLineItemGiftMessage({ lineId, message: "" })
              }}
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--ink-mute)",
                background: "transparent",
                border: 0,
                cursor: "pointer",
              }}
            >
              SUPPRIMER
            </button>
            {savedAt ? (
              <span
                className="mono"
                style={{ fontSize: 10, color: "var(--ink-mute)" }}
              >
                ✓ ENREGISTRÉ
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
