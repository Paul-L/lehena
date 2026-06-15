import { type HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

import AccountNav from "../components/account-nav"
import LogoutButton from "../components/logout-button"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  if (!customer) {
    return (
      <div className="lh" data-testid="account-page">
        {children}
      </div>
    )
  }

  return (
    <main
      className="lh"
      data-testid="account-page"
      style={{ padding: "60px 0 120px" }}
    >
      <div className="lh-wrap">
        <header
          style={{
            marginBottom: 56,
            paddingBottom: 32,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div
            className="eyebrow"
            style={{
              marginBottom: 14,
              color: "var(--ink-mute)",
              display: "flex",
              gap: 8,
            }}
          >
            <LocalizedClientLink href="/" style={{ color: "var(--ink-mute)" }}>
              Maison
            </LocalizedClientLink>
            <span>/</span>
            <span style={{ color: "var(--ink)" }}>Espace client</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            <h1
              className="serif-display"
              style={{
                fontSize: "clamp(40px, 5.5vw, 72px)",
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {customer.first_name ?? ""} {customer.last_name ?? ""}
              <span style={{ color: "var(--rouge)" }}>.</span>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ textAlign: "right" }}>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ink-mute)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Connecté en tant que
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 15,
                    color: "var(--ink-soft)",
                  }}
                >
                  {customer.email}
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div
          className="dashboard-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 64,
            alignItems: "start",
          }}
        >
          <AccountNav />
          <section style={{ minWidth: 0 }}>{children}</section>
        </div>
      </div>
    </main>
  )
}

export default AccountLayout
