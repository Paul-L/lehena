"use client"

import { type HttpTypes } from "@medusajs/types"
import { LhHeart } from "@modules/common/components/lehena/icons"
import { Placeholder } from "@modules/common/components/lehena/primitives"
import Image from "next/image"
import { useState } from "react"
import Zoom from "react-medium-image-zoom"

import "react-medium-image-zoom/dist/styles.css"

const TONES = ["rouge", "kraft", "encre", "argile", "olive", "creme"] as const

interface GalleryProps {
  images: HttpTypes.StoreProductImage[]
  title: string
  badges?: string[]
}

export default function LehenaPDPGallery({
  images,
  title,
  badges = [],
}: GalleryProps) {
  const [active, setActive] = useState(0)
  const safeImages = images.length > 0 ? images : []
  const showFallback = safeImages.length === 0
  const placeholders = Array.from({ length: 4 }).map((_, i) => ({
    label: `${title} · 0${i + 1}`,
    tone: TONES[i % TONES.length],
  }))

  const slots = showFallback
    ? placeholders.map((p) => ({ image: null, ...p }))
    : safeImages.map((img, i) => ({
        image: img,
        label: `${title} · 0${i + 1}`,
        tone: TONES[i % TONES.length],
      }))

  const current = slots[active] ?? slots[0]

  return (
    <div
      style={{
        position: "sticky",
        top: 100,
        display: "grid",
        gridTemplateColumns: "80px 1fr",
        gap: 16,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {slots.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Image ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            style={{
              border:
                i === active ? "1px solid var(--ink)" : "1px solid var(--line)",
              padding: 0,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {s.image ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={s.image.url}
                  alt={s.label}
                  fill
                  sizes="80px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : (
              <Placeholder label={String(i + 1)} aspect="1/1" tone={s.tone} />
            )}
          </button>
        ))}
      </div>
      <div style={{ position: "relative" }}>
        {current.image ? (
          <Zoom zoomMargin={32} classDialog="lh-zoom-dialog">
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",
                overflow: "hidden",
                background: "var(--paper)",
                cursor: "zoom-in",
              }}
            >
              <Image
                src={current.image.url}
                alt={current.label}
                fill
                priority
                sizes="(max-width: 720px) 100vw, 60vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          </Zoom>
        ) : (
          <Placeholder label={current.label} aspect="4/5" tone={current.tone} />
        )}
        {badges.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              maxWidth: "calc(100% - 80px)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            {badges.map((b) => (
              <span
                key={b}
                className="chip chip-solid"
                style={{ fontSize: 10 }}
              >
                {b}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          aria-label="Ajouter aux favoris"
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--bg)",
            display: "grid",
            placeItems: "center",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            zIndex: 2,
          }}
        >
          <LhHeart size={16} />
        </button>
      </div>
    </div>
  )
}
