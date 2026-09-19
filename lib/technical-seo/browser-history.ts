'use client'

const STORAGE_KEY = 'locitra:technical-seo:scan-history'
const MAX_SCAN_IDS = 20

export type ScanHistoryEntry = {
  scanId: string
  accessKey?: string
}

export function readScanHistory(): ScanHistoryEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((value): ScanHistoryEntry | null => {
        if (typeof value === 'string') return { scanId: value }
        if (
          value &&
          typeof value === 'object' &&
          typeof value.scanId === 'string'
        ) {
          return {
            scanId: value.scanId,
            accessKey:
              typeof value.accessKey === 'string' ? value.accessKey : undefined,
          }
        }
        return null
      })
      .filter((value): value is ScanHistoryEntry => Boolean(value))
      .slice(0, MAX_SCAN_IDS)
  } catch {
    return []
  }
}

export function rememberScan(scanId: string, accessKey?: string) {
  if (typeof window === 'undefined') return

  const current = readScanHistory()
  const next = [
    { scanId, ...(accessKey ? { accessKey } : {}) },
    ...current.filter((entry) => entry.scanId !== scanId),
  ].slice(0, MAX_SCAN_IDS)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // History is an enhancement; a storage failure must not block scans.
  }
}

export function forgetScan(scanId: string) {
  if (typeof window === 'undefined') return

  const next = readScanHistory().filter((entry) => entry.scanId !== scanId)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage failures.
  }
}
