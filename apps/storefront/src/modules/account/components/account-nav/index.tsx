"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, usePathname } from "next/navigation"

const SECTIONS: { href: string; label: string; testId: string }[] = [
  { href: "/account", label: "Vue d'ensemble", testId: "overview-link" },
  { href: "/account/orders", label: "Mes commandes", testId: "orders-link" },
  { href: "/account/addresses", label: "Mes adresses", testId: "addresses-link" },
  { href: "/account/profile", label: "Profil", testId: "profile-link" },
  { href: "/account/wishlist", label: "Liste d'envies", testId: "wishlist-link" },
  { href: "/account/subscriptions", label: "Mes abonnements", testId: "subscriptions-link" },
  { href: "/account/preferences", label: "Préférences", testId: "preferences-link" },
  { href: "/account/data", label: "Mes données (RGPD)", testId: "data-link" },
]

const AccountNav = () => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  return (
    <aside
      className="dashboard-nav"
      data-testid="account-nav"
      style={{
        position: "sticky",
        top: 100,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 14 }}>
        Mon compte
      </div>
      {SECTIONS.map((s) => {
        const isActive = route
          ? route.split(countryCode)[1] === s.href
          : false
        return (
          <LocalizedClientLink
            key={s.href}
            href={s.href}
            data-testid={s.testId}
            aria-current={isActive ? "page" : undefined}
            style={{
              display: "block",
              textAlign: "left",
              padding: "10px 0",
              fontFamily: "var(--serif)",
              fontSize: 17,
              fontStyle: isActive ? "italic" : "normal",
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "var(--ink)" : "var(--ink-soft)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            {s.label}
          </LocalizedClientLink>
        )
      })}
    </aside>
  )
}

export default AccountNav
