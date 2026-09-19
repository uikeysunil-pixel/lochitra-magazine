import { inngest } from './client'
import { runCrawl } from '@/lib/technical-seo/crawler'
import {
  completeScanRecord,
  failScanRecord,
  markScanRunning,
} from '@/lib/technical-seo/scan-repository'
import type { DiagnosticProblem, PlanId } from '@/lib/technical-seo/types'

interface TechnicalSeoScanEvent {
  scanId: string
  url: string
  problem: DiagnosticProblem
  plan: PlanId
}

export const technicalSeoScan = inngest.createFunction(
  {
    id: 'technical-seo-scan',
    name: 'Technical SEO scan',
    idempotency: 'event.data.scanId',
    triggers: { event: 'technical-seo/scan.requested' },
  },
  async ({ event, step }) => {
    const data = event.data as TechnicalSeoScanEvent

    await step.run('mark-scan-running', async () => {
      await markScanRunning(data.scanId)
    })

    try {
      const result = await step.run('crawl-website', () =>
        runCrawl(data.url, data.plan, data.problem, data.scanId)
      )

      await step.run('persist-scan-result', async () => {
        await completeScanRecord(data.scanId, result)
      })

      return {
        scanId: data.scanId,
        status: 'complete',
        pagesChecked: result.pagesChecked,
        findings: result.findings.length,
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to complete the Technical SEO scan.'

      await step.run('mark-scan-failed', async () => {
        await failScanRecord(data.scanId, message)
      })

      throw error
    }
  }
)
