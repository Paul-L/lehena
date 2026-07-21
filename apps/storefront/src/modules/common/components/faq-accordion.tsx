"use client"

import { LhArrow } from "@modules/common/components/lehena/icons"
import * as Accordion from "@radix-ui/react-accordion"

export interface FaqAccordionItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqAccordionItem[]
  /** Section heading. Defaults to "Questions fréquentes". */
  heading?: string
  /** DOM id used to label the section for assistive tech. */
  headingId?: string
}

/**
 * Reusable, keyboard-accessible FAQ accordion (Radix — Enter/Space toggle,
 * `aria-expanded` handled by the trigger). Renders every Q&A as VISIBLE HTML
 * so the coupled FAQPage schema stays valid (Google rejects schema whose
 * answers aren't in the rendered page). Shares the styling of the PDP FAQ.
 */
export default function FaqAccordion({
  items,
  heading = "Questions fréquentes",
  headingId = "faq-heading",
}: FaqAccordionProps) {
  if (items.length === 0) return null

  return (
    <section
      className="reveal"
      aria-labelledby={headingId}
      style={{
        padding: "clamp(48px, 9vw, 96px) 0",
        background: "var(--bg)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div className="lh-wrap-narrow">
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          {heading}
        </div>
        <h2
          id={headingId}
          className="serif-display"
          style={{ fontSize: "var(--step-4)", lineHeight: 1, marginBottom: 32 }}
        >
          {heading}
        </h2>

        <Accordion.Root type="multiple" className="flex flex-col">
          {items.map((it, i) => {
            const value = `faq-item-${i}`
            return (
              <Accordion.Item
                key={value}
                value={value}
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
            )
          })}
        </Accordion.Root>
      </div>
    </section>
  )
}
