/**
 * schema.org MerchantReturnPolicy — required by Google Product rich results
 * since 2023. Lehena default: 14-day statutory FR withdrawal window, return
 * by mail, free returns.
 */
export interface MerchantReturnPolicySchema {
  "@type": "MerchantReturnPolicy"
  applicableCountry: string
  returnPolicyCategory: string
  merchantReturnDays: number
  returnMethod: string
  returnFees: string
}

export function merchantReturnPolicy(): MerchantReturnPolicySchema {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "FR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  }
}
