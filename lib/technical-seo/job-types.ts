import type { DiagnosticProblem, PlanId } from './types'

export type ScanJobStatus = 'queued' | 'running' | 'analyzing' | 'complete' | 'failed' | 'cancelled'

export type ScanUrlState = 'queued' | 'running' | 'complete' | 'failed' | 'blocked'

export interface ScanJob {
  id: string
  websiteUrl: string
  finalUrl?: string | null
  problem: DiagnosticProblem
  plan: PlanId
  status: ScanJobStatus
  maxUrls: number
  pagesDiscovered: number
  pagesChecked: number
  pagesNotCrawled: number
  urlsBlockedByRobots: number
  crawlErrors: number
  progressPercent: number
  startedAt?: string | null
  completedAt?: string | null
  errorMessage?: string | null
  reportJson?: unknown
  createdAt: string
  updatedAt: string
}

export interface ScanUrlRecord {
  id: number
  scanId: string
  url: string
  normalizedUrl: string
  state: ScanUrlState
  depth: number
  discoveredFrom?: string | null
  attempts: number
  httpStatus?: number | null
  durationMs?: number | null
  scannedAt?: string | null
  lastError?: string | null
}

export interface ScanJobCreateInput {
  websiteUrl: string
  problem: DiagnosticProblem
  plan: PlanId
}

export const SCAN_JOB_TERMINAL_STATES: ScanJobStatus[] = ['complete', 'failed', 'cancelled']
