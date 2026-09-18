'use client'

const STORAGE_KEY = 'locitra:technical-seo:scan-history'
const MAX_SCAN_IDS = 20

export function readScanHistory(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((value): value is string => typeof value === 'string').slice(0, MAX_SCAN_IDS)
  } catch {
    return []
  }
}

export function rememberScan(scanId: string) {
  if (typeof window === 'undefined') return

  const current = readScanHistory()
  const next = [scanId, ...current.filter((id) => id !== scanId)].slice(0, MAX_SCAN_IDS)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // History is an enhancement; a storage failure must not block scans.
  }
}

export function forgetScan(scanId: string) {
  if (typeof window === 'undefined') return

  const next = readScanHistory().filter((id) => id !== scanId)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage failures.
  }
}
