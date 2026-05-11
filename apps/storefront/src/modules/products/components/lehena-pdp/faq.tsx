"use client"

import { LhArrow } from "@modules/common/components/lehena/icons"
import * as Accordion from "@radix-ui/react-accordion"

import type { FaqItem } from "@lib/data/product-details"

interface Props {
  items: FaqItem[]
}

export default function LehenaPDPFaq({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section
      className="reveal"
      aria-labelledby="pdp-faq-heading"
      style={{
        padding: "clamp(64px, 12vw, 120px) 0",
        background: "var(--bg)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div className="lh-wrap-narrow">
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          Questions fréquentes
        </div>
        <h2
          id="pdp-faq-heading"
          className="serif-display"
          style={{
            fontSize: "var(--step-4)",
            lineHeight: 1,
            marginBottom: 32,
          }}
        >
          Tout ce que vous voulez savoir,{" "}
          <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
            avant de commander.
          </em>
        </h2>

        <Accordion.Root type="multiple" className="flex flex-col">
          {items.map((it) => (
            <Accordion.Item
              key={it.id}
              value={it.id}
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <Accordion.Header>
                <Accordion.Trigger
                  className="group"
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "20px 0",
                    fontFamily: "var(--serif-display)",
                    fontSize: 20,
                    color: "var(--ink)",
                    textAlign: "left",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span>{it.question}</span>
                  <span
                    aria-hidden
                    className="group-data-[state=open]:-rotate-90 transition-transform rotate-90"
                    style={{ color: "var(--rouge)" }}
                  >
                    <LhArrow size={14} />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-open data-[state=closed]:animate-accordion-close">
                <div
                  style={{
                    paddingBottom: 20,
                    fontFamily: "var(--serif)",
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "var(--ink-soft)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {it.answer}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}
