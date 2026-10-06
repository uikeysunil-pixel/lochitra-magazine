import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { inngest } from '@/inngest/client'
import {
  createReportAccessToken,
  createScanRecord,
  failScanRecord,
  hashReportAccessToken,
} from '@/lib/technical-seo/scan-repository'
import { CRAWL_LIMITS } from '@/lib/technical-seo/crawler'
import type { DiagnosticProblem, PlanId } from '@/lib/technical-seo/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROBLEMS = new Set<DiagnosticProblem>([
  'indexing',
  'traffic-drop',
  'wrong-page',
  'slow',
  'technical',
  'schema',
  'migration',
  'broken-links',
  'duplicates',
  'unknown',
])

const PLANS = new Set<PlanId>(['free', 'quick', 'full', 'deep'])

export interface ScanRouteDependencies {
  createScanRecord?: typeof createScanRecord
  sendInngestEvent?: (event: {
    id: string
    name: 'technical-seo/scan.requested'
    data: {
      scanId: string
      url: string
      problem: DiagnosticProblem
      plan: PlanId
    }
  }) => Promise<unknown>
  failScanRecord?: typeof failScanRecord
}

export async function handleCreateScan(request: Request, deps: ScanRouteDependencies = {}) {
  const createScanRecordFn = deps.createScanRecord ?? createScanRecord
  const sendInngestEventFn =
    deps.sendInngestEvent ??
    ((event: {
      id: string
      name: 'technical-seo/scan.requested'
      data: {
        scanId: string
        url: string
        problem: DiagnosticProblem
        plan: PlanId
      }
    }) => inngest.send(event))
  const failScanRecordFn = deps.failScanRecord ?? failScanRecord

  try {
    const body = (await request.json()) as {
      url?: unknown
      problem?: unknown
      plan?: unknown
    }

    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const problem = typeof body.problem === 'string' ? body.problem : 'unknown'
    const plan = typeof body.plan === 'string' ? body.plan : 'free'

    if (!url) {
      return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 })
    }

    if (!PROBLEMS.has(problem as DiagnosticProblem)) {
      return NextResponse.json({ error: 'Invalid diagnostic problem.' }, { status: 400 })
    }

    if (!PLANS.has(plan as PlanId)) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    }

    if (plan === 'quick' || plan === 'full') {
      return NextResponse.json(
        {
          error:
            'Targeted ($39) and Full ($79) scans must be initiated through the secure checkout flow.',
        },
        { status: 400 }
      )
    }

    if (plan !== 'free' && plan !== 'deep') {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    }

    if (plan === 'deep') {
      const scanId = randomUUID()
      const accessKey = createReportAccessToken()
      const reportTokenHash = hashReportAccessToken(accessKey)

      await createScanRecordFn({
        scanId,
        websiteUrl: url,
        problem: problem as DiagnosticProblem,
        plan: 'deep',
        maxUrls: CRAWL_LIMITS.deep,
        accessMode: 'private',
        reportTokenHash,
        paymentStatus: 'unpaid',
        initialStatus: 'awaiting_gsc',
      })

      const statusUrl = `/technical-seo/scan/${scanId}/?key=${encodeURIComponent(accessKey)}`

      return NextResponse.json(
        {
          scanId,
          accessKey,
          status: 'awaiting_gsc',
          statusUrl,
          plan: 'deep',
          requiresGoogleSearchConsole: true,
          message: 'Connect Google Search Console to continue your Deep Investigation.',
        },
        { status: 201 }
      )
    }

    const scanId = randomUUID()

    await createScanRecordFn({
      scanId,
      websiteUrl: url,
      problem: problem as DiagnosticProblem,
      plan: plan as PlanId,
      maxUrls: 5,
    })

    try {
      await sendInngestEventFn({
        id: scanId,
        name: 'technical-seo/scan.requested',
        data: {
          scanId,
          url,
          problem: problem as DiagnosticProblem,
          plan: plan as PlanId,
        },
      })
    } catch (eventError) {
      const message =
        eventError instanceof Error ? eventError.message : 'Unable to queue the Technical SEO scan.'
      await failScanRecordFn(scanId, message)
      throw eventError
    }

    return NextResponse.json(
      {
        scanId,
        status: 'queued',
        statusUrl: `/technical-seo/scan/${scanId}/`,
        productStage: 'mvp-background-scan',
        message: 'Your Technical SEO scan has been queued.',
      },
      { status: 202 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze the website.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  return handleCreateScan(request)
}
