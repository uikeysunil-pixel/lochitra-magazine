import { inngest } from './client'
import {
  CRAWL_LIMITS,
  DEFAULT_CHUNK_SIZE,
  crawlChunk,
  deserializeCrawlState,
  finalizeCrawl,
  initCrawlState,
  serializeCrawlState,
} from '@/lib/technical-seo/crawler'
import {
  completeScanRecord,
  failScanRecord,
  getScanCheckpoint,
  getScanPageResults,
  markScanRunning,
  saveScanCheckpoint,
} from '@/lib/technical-seo/scan-repository'
import type { CrawlPage, DiagnosticProblem, PlanId } from '@/lib/technical-seo/types'

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
      let checkpoint = await step.run('init-crawl', async () => {
        const existing = await getScanCheckpoint(data.scanId)
        if (existing) {
          return existing
        }
        const state = await initCrawlState(data.url, data.plan, data.problem, data.scanId)
        const serialized = serializeCrawlState(state)
        const saved = await saveScanCheckpoint({
          scanId: data.scanId,
          checkpoint: serialized,
          newPages: [],
          pagesChecked: 0,
          pagesDiscovered: serialized.seen.length,
          progressPercent: 0,
          expectedSequence: null,
        })
        if (!saved) {
          const fresh = await getScanCheckpoint(data.scanId)
          if (fresh) return fresh
        }
        return serialized
      })

      const maxUrls = CRAWL_LIMITS[data.plan]
      const maxChunks = Math.ceil(maxUrls / DEFAULT_CHUNK_SIZE) + 5
      let chunkIndex = 0

      while (!checkpoint.isDone && chunkIndex < maxChunks) {
        const currentChunk = chunkIndex
        checkpoint = await step.run(`crawl-chunk-${currentChunk}`, async () => {
          const latest = (await getScanCheckpoint(data.scanId)) ?? checkpoint
          if (latest.isDone) {
            return latest
          }

          const expectedPreviousSequence = latest.sequence ?? 0

          const activeState = deserializeCrawlState(latest)
          const { state: updatedState, newPages } = await crawlChunk(
            activeState,
            DEFAULT_CHUNK_SIZE
          )

          const serialized = serializeCrawlState(updatedState)
          const progressPercent =
            updatedState.pagesChecked === 0
              ? 0
              : Math.min(
                  99,
                  Math.max(1, Math.round((updatedState.pagesChecked / updatedState.maxUrls) * 100))
                )

          const crawlPages: CrawlPage[] = newPages.map((p) => ({
            url: p.url,
            finalUrl: p.finalUrl,
            httpStatus: p.httpStatus,
            durationMs: p.durationMs,
            findingsCount: p.findings.length,
            state: p.httpStatus >= 400 ? 'failed' : 'complete',
            depth:
              updatedState.pageDepthMap.get(p.finalUrl) ??
              updatedState.pageDepthMap.get(p.url) ??
              null,
            resultJson: p,
          }))

          const legacyPages =
            latest.pageResults && latest.pageResults.length > 0 ? latest.pageResults : undefined

          const saved = await saveScanCheckpoint({
            scanId: data.scanId,
            checkpoint: serialized,
            newPages: crawlPages,
            legacyPages,
            pagesChecked: updatedState.pagesChecked,
            pagesDiscovered: serialized.seen.length,
            progressPercent,
            expectedSequence: expectedPreviousSequence,
          })

          if (!saved) {
            const freshLatest = await getScanCheckpoint(data.scanId)
            if (!freshLatest) {
              throw new Error(`Checkpoint conflict: Scan ${data.scanId} checkpoint disappeared.`)
            }

            if ((freshLatest.sequence ?? 0) >= (serialized.sequence ?? 0)) {
              return freshLatest
            }

            return freshLatest
          }

          return serialized
        })

        chunkIndex++
      }

      const result = await step.run('finalize-scan', async () => {
        const latest = (await getScanCheckpoint(data.scanId)) ?? checkpoint
        let pageResults = await getScanPageResults(data.scanId, 50)
        if (pageResults.length === 0 && latest.pageResults && latest.pageResults.length > 0) {
          await saveScanCheckpoint({
            scanId: data.scanId,
            checkpoint: latest,
            newPages: [],
            legacyPages: latest.pageResults,
            pagesChecked: latest.pagesChecked ?? latest.pageResults.length,
            pagesDiscovered: latest.seen.length,
            progressPercent: 100,
            expectedSequence: latest.sequence,
          })
          pageResults = await getScanPageResults(data.scanId, 50)
        }
        const activeState = deserializeCrawlState(latest, undefined, pageResults)
        const finalResult = finalizeCrawl(activeState)
        await completeScanRecord(data.scanId, finalResult)
        return {
          scanId: data.scanId,
          status: 'complete',
          pagesChecked: finalResult.pagesChecked,
          findings: finalResult.findings.length,
        }
      })

      return result
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to complete the Technical SEO scan.'

      await step.run('mark-scan-failed', async () => {
        await failScanRecord(data.scanId, message)
      })

      throw error
    }
  }
)
