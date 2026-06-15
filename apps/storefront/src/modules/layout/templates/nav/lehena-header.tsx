"use client"

import {
  LhArrow,
  LhBurger,
  LhClose,
  LhSearch,
  LhUser,
} from "@modules/common/components/lehena/icons"
import { Frieze, Logo } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
// import { LehenaLanguageSwitcher } from "@modules/layout/components/lehena-language-switcher"
import { LehenaSearchAutocomplete } from "@modules/layout/components/lehena-search-autocomplete"
import { useEffect, useState, type ReactNode } from "react"

const ANNOUNCE = [
  "Livraison Chronofresh 24–48h",
  "Frais de port offerts dès 50 €",
]

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Boutique", href: "/store" },
  { label: "Jambons", href: "/categories/jambons-iparralde" },
  { label: "Salaisons", href: "/categories/salaisons" },
  { label: "Patxaran", href: "/categories/patxaran-spiritueux" },
  { label: "Épicerie", href: "/categories/epicerie" },
  { label: "La ferme", href: "/la-ferme" },
]

const Announcement = () => (
  <div
    className="announce"
    style={{
      background: "var(--ink)",
      color: "var(--bg)",
      padding: "10px 0",
    }}
  >
    <div
      className="lh-wrap announce-row"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 36,
        flexWrap: "wrap",
      }}
    >
      {ANNOUNCE.map((m, i) => (
        <div
          key={m}
          className="mono announce-item"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 36,
            fontSize: 11,
          }}
        >
          <span style={{ color: "var(--bg)" }}>{m}</span>
          {i < ANNOUNCE.length - 1 && (
            <span
              aria-hidden
              className="announce-dot"
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: "var(--rouge)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  </div>
)

interface LehenaHeaderProps {
  cartButton: ReactNode
}

export default function LehenaHeader({ cartButton }: LehenaHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen && !searchOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false)
        setSearchOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen, searchOpen])

  const linkStyle: React.CSSProperties = {
    fontSize: 13,
    fontFamily: "var(--mono)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink)",
    fontWeight: 500,
    whiteSpace: "nowrap",
    paddingBottom: 2,
  }

  return (
    <>
      <Announcement />
      <header
        className="site-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: scrolled ? "var(--bg)" : "var(--bg-elevated)",
          borderBottom: scrolled
            ? "1px solid var(--line)"
            : "1px solid transparent",
          transition: "all 240ms ease",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="lh-wrap header-row">
          <button
            type="button"
            className="header-burger"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <LhClose size={20} /> : <LhBurger size={22} />}
          </button>

          <nav className="header-nav-left">
            {NAV_LINKS.slice(0, 5).map((l) => (
              <LocalizedClientLink
                key={l.label}
                href={l.href}
                style={linkStyle}
              >
                {l.label}
              </LocalizedClientLink>
            ))}
          </nav>

          <LocalizedClientLink
            href="/"
            className="header-logo"
            aria-label="Maison Lehena — Accueil"
          >
            <Logo height={scrolled ? 38 : 50} />
          </LocalizedClientLink>

          <div className="header-actions">
            <div className="header-nav-right">
              {NAV_LINKS.slice(5).map((l) => (
                <LocalizedClientLink
                  key={l.label}
                  href={l.href}
                  style={linkStyle}
                >
                  {l.label}
                </LocalizedClientLink>
              ))}
              <div
                style={{
                  width: 1,
                  height: 18,
                  background: "var(--line-strong)",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Rechercher"
              className="header-icon-btn"
            >
              <LhSearch size={18} />
            </button>
            <LocalizedClientLink
              href="/account"
              aria-label="Compte"
              className="header-icon-btn header-account"
            >
              <LhUser size={18} />
            </LocalizedClientLink>
            {/*
            <span
              aria-hidden
              className="hidden small:inline-block"
              style={{ width: 1, height: 18, background: "var(--line-strong)" }}
            />
            <div className="hidden small:inline-flex">
              <LehenaLanguageSwitcher variant="header" />
            </div>
            */}
            {cartButton}
          </div>
        </div>

        {searchOpen && (
          <div className="header-search">
            <div className="lh-wrap-narrow" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Fermer la recherche"
                style={{
                  position: "absolute",
                  top: -4,
                  right: 0,
                  color: "var(--ink-mute)",
                  padding: 8,
                }}
              >
                <LhClose size={20} />
              </button>
              <LehenaSearchAutocomplete onPick={() => setSearchOpen(false)} />
            </div>
          </div>
        )}

        <Frieze color="var(--ink)" size={8} opacity={0.7} />
      </header>

      <div
        className={`mobile-menu ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      >
        <aside
          className="mobile-menu-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-menu-head">
            <Logo height={36} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer"
            >
              <LhClose size={22} />
            </button>
          </div>
          <nav className="mobile-menu-nav">
            {NAV_LINKS.map((l) => (
              <LocalizedClientLink
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
                <LhArrow size={16} />
              </LocalizedClientLink>
            ))}
          </nav>
          <div className="mobile-menu-foot">
            <LocalizedClientLink href="/account">
              <LhUser size={16} /> Mon compte
            </LocalizedClientLink>
            <a href="mailto:contact@lehena.fr">contact@lehena.fr</a>
            {/*
            <div className="pt-3 border-t border-line">
              <LehenaLanguageSwitcher variant="menu" />
            </div>
            */}
          </div>
        </aside>
      </div>
    </>
  )
}
