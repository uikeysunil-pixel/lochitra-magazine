export const INDIA_BILLING_COUNTRY = 'IN'

export function normalizeBillingCountry(value: unknown): string {
  return typeof value === 'string' && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : ''
}

export function isInternationalBillingCountry(value: unknown): boolean {
  const country = normalizeBillingCountry(value)
  return country.length === 2 && country !== INDIA_BILLING_COUNTRY
}
