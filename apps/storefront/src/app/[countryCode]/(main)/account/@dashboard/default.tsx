// Default slot for /account/* sub-paths that don't have a matching dashboard
// page (e.g. /account/forgot-password lives only in @login). Logged-in users
// who land on those URLs get redirected back to the account home.
import { redirect } from "next/navigation"

export default async function DashboardDefault({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  redirect(`/${countryCode}/account`)
}
