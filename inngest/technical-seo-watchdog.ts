import { inngest } from './client'
import { listUnsentPaidScans, markBackgroundEventSent } from '@/lib/technical-seo/scan-repository'
import type { DiagnosticProblem, PlanId } from '@/lib/technical-seo/types'

export interface PaidScanCandidate {
  id: string
  website_url: string
  problem: DiagnosticProblem
  plan: PlanId
  payment_status: string
  status: string
  paid_at: string | Date | null
  background_event_sent_at: string | Date | null
}

export interface PaidScanWatchdogEventPayload {
  id: string
  name: 'technical-seo/scan.requested'
  data: {
    scanId: string
    url: string
    problem: DiagnosticProblem
    plan: PlanId
  }
}

export interface PaidScanWatchdogDependencies {
  findCandidates?: (options?: {
    limit?: number
    olderThanSeconds?: number
  }) => Promise<PaidScanCandidate[]>
  sendInngestEvent?: (event: PaidScanWatchdogEventPayload) => Promise<unknown>
  markBackgroundEventSent?: (scanId: string) => Promise<unknown>
  logger?: {
    info?: (...args: unknown[]) => void
    warn?: (...args: unknown[]) => void
    error?: (...args: unknown[]) => void
  }
}

export interface PaidScanWatchdogRunResult {
  evaluated: number
  dispatched: number
  failed: number
  errors: Array<{ scanId: string; error: string }>
}

export async function runPaidScanWatchdog(
  deps: PaidScanWatchdogDependencies = {}
): Promise<PaidScanWatchdogRunResult> {
  const findCandidatesFn = deps.findCandidates ?? listUnsentPaidScans
  const sendInngestEventFn =
    deps.sendInngestEvent ?? ((event: PaidScanWatchdogEventPayload) => inngest.send(event))
  const markBackgroundEventSentFn = deps.markBackgroundEventSent ?? markBackgroundEventSent
  const logger = deps.logger ?? console

  const candidates = await findCandidatesFn({ limit: 20, olderThanSeconds: 60 })

  const results: PaidScanWatchdogRunResult = {
    evaluated: candidates.length,
    dispatched: 0,
    failed: 0,
    errors: [],
  }

  for (const scan of candidates) {
    const event: PaidScanWatchdogEventPayload = {
      id: `technical-seo-paid-scan-${scan.id}`,
      name: 'technical-seo/scan.requested',
      data: {
        scanId: scan.id,
        url: scan.website_url,
        problem: scan.problem,
        plan: scan.plan,
      },
    }

    try {
      await sendInngestEventFn(event)
      await markBackgroundEventSentFn(scan.id)
      results.dispatched++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error?.(
        `[PaidScanWatchdog] Failed to dispatch Inngest event for scan ${scan.id}:`,
        error
      )
      results.failed++
      results.errors.push({ scanId: scan.id, error: errorMessage })
    }
  }

  return results
}

export const technicalSeoPaidScanWatchdog = inngest.createFunction(
  {
    id: 'technical-seo-paid-scan-watchdog',
    name: 'Technical SEO paid scan watchdog',
    concurrency: 1,
    triggers: [{ cron: '*/2 * * * *' }],
  },
  async ({ step }) => {
    return await step.run('dispatch-stuck-paid-scans', async () => {
      return await runPaidScanWatchdog()
    })
  }
)
