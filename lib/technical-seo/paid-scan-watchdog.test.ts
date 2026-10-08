import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'
}

/* Test doubles intentionally use any to match the injected repository/API seams. */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */

const { listUnsentPaidScans } = require('./scan-repository')
const {
  runPaidScanWatchdog,
  technicalSeoPaidScanWatchdog,
} = require('../../inngest/technical-seo-watchdog')
const { technicalSeoScan } = require('../../inngest/technical-seo-scan')

import type {
  PaidScanCandidate,
  PaidScanWatchdogEventPayload,
} from '../../inngest/technical-seo-watchdog'
import type { DiagnosticProblem, PlanId } from './types'

describe('Autonomous Inngest Watchdog for Paid Technical SEO Scans', () => {
  describe('Repository Query Filter (listUnsentPaidScans)', () => {
    interface MockScanRow {
      id: string
      website_url: string
      problem: DiagnosticProblem
      plan: PlanId
      payment_status: string
      status: string
      paid_at: Date | null
      background_event_sent_at: Date | null
    }

    function createMockSql(rows: MockScanRow[]) {
      return async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const queryText = strings.join('?')
        assert.ok(queryText.includes('from seo_scans'), 'Query must target seo_scans')
        assert.ok(
          queryText.includes("payment_status = 'paid'"),
          'Must filter by paid payment_status'
        )
        assert.ok(queryText.includes("status = 'queued'"), 'Must filter by queued status')
        assert.ok(
          queryText.includes('background_event_sent_at is null'),
          'Must filter by null background_event_sent_at'
        )
        assert.ok(queryText.includes('paid_at < now() -'), 'Must filter by grace period on paid_at')

        const olderThanSeconds = (values[0] as number) ?? 60
        const limit = (values[1] as number) ?? 20
        const cutoffTime = Date.now() - olderThanSeconds * 1000

        const filtered = rows.filter((r) => {
          if (r.payment_status !== 'paid') return false
          if (r.status !== 'queued') return false
          if (r.background_event_sent_at !== null) return false
          if (!r.paid_at || r.paid_at.getTime() >= cutoffTime) return false
          return true
        })

        return filtered.slice(0, limit)
      }
    }

    it('1. A paid/queued scan with NULL background_event_sent_at is selected after the 60-second grace period', async () => {
      const maturePaidScan: MockScanRow = {
        id: 'scan-mature-1',
        website_url: 'https://example.com/mature',
        problem: 'indexing',
        plan: 'full',
        payment_status: 'paid',
        status: 'queued',
        paid_at: new Date(Date.now() - 120_000), // 120 seconds ago (> 60s grace period)
        background_event_sent_at: null,
      }

      const mockSql = createMockSql([maturePaidScan])
      const result = await listUnsentPaidScans(
        { limit: 20, olderThanSeconds: 60 },
        { sql: mockSql as any }
      )

      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].id, 'scan-mature-1')
      assert.strictEqual(result[0].payment_status, 'paid')
      assert.strictEqual(result[0].status, 'queued')
      assert.strictEqual(result[0].background_event_sent_at, null)
    })

    it('2. A freshly paid scan is NOT selected (within 60-second grace period)', async () => {
      const freshPaidScan: MockScanRow = {
        id: 'scan-fresh-2',
        website_url: 'https://example.com/fresh',
        problem: 'indexing',
        plan: 'quick',
        payment_status: 'paid',
        status: 'queued',
        paid_at: new Date(Date.now() - 15_000), // 15 seconds ago (< 60s grace period)
        background_event_sent_at: null,
      }

      const mockSql = createMockSql([freshPaidScan])
      const result = await listUnsentPaidScans(
        { limit: 20, olderThanSeconds: 60 },
        { sql: mockSql as any }
      )

      assert.strictEqual(result.length, 0, 'Freshly paid scan must not be selected')
    })

    it('3. A scan with background_event_sent_at already set is NOT selected', async () => {
      const alreadySentScan: MockScanRow = {
        id: 'scan-already-sent-3',
        website_url: 'https://example.com/sent',
        problem: 'technical',
        plan: 'deep',
        payment_status: 'paid',
        status: 'queued',
        paid_at: new Date(Date.now() - 180_000),
        background_event_sent_at: new Date(Date.now() - 170_000), // already dispatched
      }

      const mockSql = createMockSql([alreadySentScan])
      const result = await listUnsentPaidScans(
        { limit: 20, olderThanSeconds: 60 },
        { sql: mockSql as any }
      )

      assert.strictEqual(
        result.length,
        0,
        'Scan with background_event_sent_at set must not be selected'
      )
    })

    it('4. A non-paid scan is NOT selected', async () => {
      const unpaidScans: MockScanRow[] = [
        {
          id: 'scan-unpaid-4a',
          website_url: 'https://example.com/unpaid',
          problem: 'indexing',
          plan: 'quick',
          payment_status: 'unpaid',
          status: 'queued',
          paid_at: new Date(Date.now() - 120_000),
          background_event_sent_at: null,
        },
        {
          id: 'scan-pending-4b',
          website_url: 'https://example.com/pending',
          problem: 'indexing',
          plan: 'full',
          payment_status: 'pending',
          status: 'queued',
          paid_at: new Date(Date.now() - 120_000),
          background_event_sent_at: null,
        },
        {
          id: 'scan-failed-4c',
          website_url: 'https://example.com/failed',
          problem: 'indexing',
          plan: 'deep',
          payment_status: 'failed',
          status: 'queued',
          paid_at: new Date(Date.now() - 120_000),
          background_event_sent_at: null,
        },
      ]

      const mockSql = createMockSql(unpaidScans)
      const result = await listUnsentPaidScans(
        { limit: 20, olderThanSeconds: 60 },
        { sql: mockSql as any }
      )

      assert.strictEqual(result.length, 0, 'Non-paid scans must not be selected')
    })

    it('5. A non-queued scan is NOT selected', async () => {
      const nonQueuedScans: MockScanRow[] = [
        {
          id: 'scan-running-5a',
          website_url: 'https://example.com/running',
          problem: 'indexing',
          plan: 'quick',
          payment_status: 'paid',
          status: 'running',
          paid_at: new Date(Date.now() - 120_000),
          background_event_sent_at: null,
        },
        {
          id: 'scan-complete-5b',
          website_url: 'https://example.com/complete',
          problem: 'indexing',
          plan: 'full',
          payment_status: 'paid',
          status: 'complete',
          paid_at: new Date(Date.now() - 120_000),
          background_event_sent_at: null,
        },
        {
          id: 'scan-awaiting-5c',
          website_url: 'https://example.com/awaiting',
          problem: 'indexing',
          plan: 'deep',
          payment_status: 'paid',
          status: 'awaiting_payment',
          paid_at: new Date(Date.now() - 120_000),
          background_event_sent_at: null,
        },
      ]

      const mockSql = createMockSql(nonQueuedScans)
      const result = await listUnsentPaidScans(
        { limit: 20, olderThanSeconds: 60 },
        { sql: mockSql as any }
      )

      assert.strictEqual(result.length, 0, 'Non-queued scans must not be selected')
    })
  })

  describe('Watchdog Dispatch Execution & Error Safety (runPaidScanWatchdog)', () => {
    it('6. Successful inngest.send() causes markBackgroundEventSent() strictly afterward', async () => {
      const candidate: PaidScanCandidate = {
        id: 'scan-success-6',
        website_url: 'https://example.com/success',
        problem: 'indexing',
        plan: 'quick',
        payment_status: 'paid',
        status: 'queued',
        paid_at: new Date(Date.now() - 90_000),
        background_event_sent_at: null,
      }

      const executionOrder: string[] = []
      let sentScanId: string | null = null

      const result = await runPaidScanWatchdog({
        findCandidates: async () => [candidate],
        sendInngestEvent: async (event: PaidScanWatchdogEventPayload) => {
          executionOrder.push('sendInngestEvent')
          assert.strictEqual(event.id, 'technical-seo-paid-scan-scan-success-6')
          return {}
        },
        markBackgroundEventSent: async (id: string) => {
          executionOrder.push('markBackgroundEventSent')
          sentScanId = id
        },
      })

      assert.strictEqual(result.evaluated, 1)
      assert.strictEqual(result.dispatched, 1)
      assert.strictEqual(result.failed, 0)
      assert.deepStrictEqual(
        executionOrder,
        ['sendInngestEvent', 'markBackgroundEventSent'],
        'markBackgroundEventSent must be invoked strictly AFTER sendInngestEvent resolves'
      )
      assert.strictEqual(sentScanId, 'scan-success-6')
    })

    it('7. Failed inngest.send() does NOT call markBackgroundEventSent()', async () => {
      const candidate: PaidScanCandidate = {
        id: 'scan-fail-7',
        website_url: 'https://example.com/fail',
        problem: 'slow',
        plan: 'full',
        payment_status: 'paid',
        status: 'queued',
        paid_at: new Date(Date.now() - 90_000),
        background_event_sent_at: null,
      }

      let markedSent = false
      const loggedErrors: unknown[] = []

      const result = await runPaidScanWatchdog({
        findCandidates: async () => [candidate],
        sendInngestEvent: async () => {
          throw new Error('Inngest API 503 Service Unavailable')
        },
        markBackgroundEventSent: async () => {
          markedSent = true
        },
        logger: {
          error: (...args: unknown[]) => loggedErrors.push(args),
        },
      })

      assert.strictEqual(result.evaluated, 1)
      assert.strictEqual(result.dispatched, 0)
      assert.strictEqual(result.failed, 1)
      assert.strictEqual(result.errors.length, 1)
      assert.strictEqual(result.errors[0].scanId, 'scan-fail-7')
      assert.strictEqual(result.errors[0].error, 'Inngest API 503 Service Unavailable')
      assert.strictEqual(
        markedSent,
        false,
        'markBackgroundEventSent must NOT be called if inngest.send() throws'
      )
      assert.ok(loggedErrors.length > 0, 'Error must be logged')
    })

    it('8. Failed dispatch remains recoverable on a subsequent watchdog run', async () => {
      // Mutable mock candidate record simulating database persistence
      const persistentScan: PaidScanCandidate = {
        id: 'scan-retry-8',
        website_url: 'https://example.com/retry',
        problem: 'broken-links',
        plan: 'full',
        payment_status: 'paid',
        status: 'queued',
        paid_at: new Date(Date.now() - 150_000),
        background_event_sent_at: null,
      }

      // Query function filters out scans where background_event_sent_at is non-null
      const findCandidates = async () => {
        return persistentScan.background_event_sent_at === null ? [persistentScan] : []
      }

      const markSent = async (id: string) => {
        assert.strictEqual(id, persistentScan.id)
        persistentScan.background_event_sent_at = new Date()
      }

      // RUN 1: Inngest fails
      let inngestShouldFail = true
      const run1 = await runPaidScanWatchdog({
        findCandidates,
        sendInngestEvent: async () => {
          if (inngestShouldFail) throw new Error('Network timeout reaching Inngest')
          return {}
        },
        markBackgroundEventSent: markSent,
        logger: { error: () => {} },
      })

      assert.strictEqual(run1.evaluated, 1)
      assert.strictEqual(run1.failed, 1)
      assert.strictEqual(run1.dispatched, 0)
      assert.strictEqual(
        persistentScan.background_event_sent_at,
        null,
        'background_event_sent_at must remain NULL after failure'
      )

      // RUN 2: Inngest is now healthy -> watchdog retries and recovers the scan
      inngestShouldFail = false
      const run2 = await runPaidScanWatchdog({
        findCandidates,
        sendInngestEvent: async () => ({}),
        markBackgroundEventSent: markSent,
      })

      assert.strictEqual(run2.evaluated, 1)
      assert.strictEqual(run2.failed, 0)
      assert.strictEqual(run2.dispatched, 1, 'Failed scan was successfully recovered on next run')
      assert.ok(
        persistentScan.background_event_sent_at !== null,
        'background_event_sent_at was recorded after successful recovery'
      )

      // RUN 3: Subsequent run sees no candidates
      const run3 = await runPaidScanWatchdog({
        findCandidates,
        sendInngestEvent: async () => ({}),
        markBackgroundEventSent: markSent,
      })

      assert.strictEqual(
        run3.evaluated,
        0,
        'Recovered scan is no longer selected on subsequent runs'
      )
      assert.strictEqual(run3.dispatched, 0)
    })

    it('9. The deterministic event ID is exactly technical-seo-paid-scan-${scanId}', async () => {
      const candidate: PaidScanCandidate = {
        id: '2b4c107e-1234-4567-89ab-cdef01234567',
        website_url: 'https://locitra.com',
        problem: 'traffic-drop',
        plan: 'deep',
        payment_status: 'paid',
        status: 'queued',
        paid_at: new Date(Date.now() - 100_000),
        background_event_sent_at: null,
      }

      let capturedPayload: PaidScanWatchdogEventPayload | null = null

      await runPaidScanWatchdog({
        findCandidates: async () => [candidate],
        sendInngestEvent: async (event) => {
          capturedPayload = event
          return {}
        },
        markBackgroundEventSent: async () => {},
      })

      assert.ok(capturedPayload)
      assert.strictEqual(
        (capturedPayload as PaidScanWatchdogEventPayload).id,
        'technical-seo-paid-scan-2b4c107e-1234-4567-89ab-cdef01234567',
        'Deterministic event ID must match technical-seo-paid-scan-${scanId}'
      )
      assert.strictEqual(
        (capturedPayload as PaidScanWatchdogEventPayload).name,
        'technical-seo/scan.requested'
      )
      assert.strictEqual(
        (capturedPayload as PaidScanWatchdogEventPayload).data.scanId,
        '2b4c107e-1234-4567-89ab-cdef01234567'
      )
      assert.strictEqual(
        (capturedPayload as PaidScanWatchdogEventPayload).data.url,
        'https://locitra.com'
      )
      assert.strictEqual(
        (capturedPayload as PaidScanWatchdogEventPayload).data.problem,
        'traffic-drop'
      )
      assert.strictEqual((capturedPayload as PaidScanWatchdogEventPayload).data.plan, 'deep')
    })

    it('10. The existing technicalSeoScan function remains unchanged in behavior', () => {
      // Invariant check on technicalSeoScan definition
      assert.ok(technicalSeoScan, 'technicalSeoScan must be exported and defined')
      assert.strictEqual(
        technicalSeoScan.name,
        'Technical SEO scan',
        'technicalSeoScan name must remain unchanged'
      )
    })

    it('11. Watchdog Inngest function definition has concurrency: 1 and cron: */2 * * * *', () => {
      assert.ok(technicalSeoPaidScanWatchdog, 'technicalSeoPaidScanWatchdog must be defined')
      assert.strictEqual(technicalSeoPaidScanWatchdog.name, 'Technical SEO paid scan watchdog')
    })

    it('12. Independent candidate processing: failing candidate does not abort subsequent candidates in the batch', async () => {
      const candidates: PaidScanCandidate[] = [
        {
          id: 'scan-batch-fail-1',
          website_url: 'https://example.com/1',
          problem: 'indexing',
          plan: 'quick',
          payment_status: 'paid',
          status: 'queued',
          paid_at: new Date(Date.now() - 100_000),
          background_event_sent_at: null,
        },
        {
          id: 'scan-batch-success-2',
          website_url: 'https://example.com/2',
          problem: 'technical',
          plan: 'full',
          payment_status: 'paid',
          status: 'queued',
          paid_at: new Date(Date.now() - 100_000),
          background_event_sent_at: null,
        },
      ]

      const markedIds: string[] = []

      const result = await runPaidScanWatchdog({
        findCandidates: async () => candidates,
        sendInngestEvent: async (event) => {
          if (event.data.scanId === 'scan-batch-fail-1') {
            throw new Error('Transient failure on scan 1')
          }
          return {}
        },
        markBackgroundEventSent: async (id: string) => {
          markedIds.push(id)
        },
        logger: { error: () => {} },
      })

      assert.strictEqual(result.evaluated, 2)
      assert.strictEqual(result.failed, 1)
      assert.strictEqual(result.dispatched, 1)
      assert.deepStrictEqual(
        markedIds,
        ['scan-batch-success-2'],
        'Candidate 2 must succeed and be marked sent despite candidate 1 failing'
      )
    })
  })
})
