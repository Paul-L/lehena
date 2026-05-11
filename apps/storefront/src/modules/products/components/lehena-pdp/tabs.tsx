"use client"

import { useState } from "react"

interface Tab {
  id: string
  label: string
  content: string
}

interface Props {
  tabs: Tab[]
}

export default function LehenaProductTabs({ tabs }: Props) {
  const [active, setActive] = useState(tabs[0]?.id)
  if (tabs.length === 0) return null
  const current = tabs.find((t) => t.id === active) ?? tabs[0]

  return (
    <div style={{ borderTop: "1px solid var(--ink)" }}>
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--line)",
        }}
      >
        {tabs.map((t) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.id)}
              style={{
                padding: "16px 8px",
                flex: 1,
                fontSize: 12,
                fontFamily: "var(--mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isActive ? "var(--ink)" : "var(--ink-mute)",
                borderBottom: isActive
                  ? "2px solid var(--rouge)"
                  : "2px solid transparent",
                marginBottom: -1,
                background: "transparent",
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        style={{
          padding: "24px 0",
          fontFamily: "var(--serif)",
          fontSize: 16,
          color: "var(--ink-soft)",
          lineHeight: 1.65,
          minHeight: 120,
          whiteSpace: "pre-line",
        }}
      >
        {current.content}
      </div>
    </div>
  )
}
