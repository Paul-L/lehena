import { retrieveCustomer } from "@lib/data/customer"
import { listRegions } from "@lib/data/regions"
import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import { type Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Consultez et modifiez votre profil Maison Lehena.",
  robots: { index: false, follow: false },
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div style={{ marginBottom: 32 }}>
        <h2
          className="serif-display"
          style={{ fontSize: 32, lineHeight: 1, margin: "0 0 8px", letterSpacing: "-0.015em" }}
        >
          Mon profil
        </h2>
        <p
          style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink-soft)", margin: 0 }}
        >
          Consultez et modifiez vos informations : nom, e-mail, téléphone et
          adresse de facturation.
        </p>
      </div>
      <div className="flex flex-col w-full">
        <ProfileName customer={customer} />
        <ProfileEmail customer={customer} />
        <ProfilePhone customer={customer} />
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
    </div>
  )
}
