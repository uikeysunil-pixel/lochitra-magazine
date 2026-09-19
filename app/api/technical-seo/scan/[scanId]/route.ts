import { NextResponse } from 'next/server'
import {
  getScanRecord,
  verifyReportAccessToken,
} from '@/lib/technical-seo/scan-repository'
import type { CrawlResult, DiagnosticProblem } from '@/lib/technical-seo/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROBLEM_LABELS: Record<DiagnosticProblem, string> = {
  indexing: "My pages aren't getting indexed",
  'traffic-drop': 'My organic traffic dropped',
  'wrong-page': 'Google is showing the wrong page',
  slow: 'My website is slow',
  technical: 'I have technical SEO errors',
  schema: 'My schema / structured data has problems',
  migration: 'I recently redesigned or migrated my website',
  'broken-links': 'I have broken pages or links',
  duplicates: 'I have duplicate or low-value pages',
  unknown: "I don't know — find the important problems",
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await context.params

  if (!isUuid(scanId)) {
    return NextResponse.json({ error: 'Invalid scan ID.' }, { status: 400 })
  }

  try {
    const row = await getScanRecord(scanId)

    if (!row) {
      return NextResponse.json({ error: 'Scan not found.' }, { status: 404 })
    }

    const requestUrl = new URL(_request.url)
    const summaryOnly = requestUrl.searchParams.get('summary') === '1'
    const accessToken = requestUrl.searchParams.get('key')

    if (
      row.access_mode === 'private' &&
      !verifyReportAccessToken(accessToken, row.report_token_hash)
    ) {
      return NextResponse.json(
        { error: 'This scan report requires a valid access link.' },
        { status: 403 }
      )
    }

    const base = {
      scanId,
      websiteUrl: row.website_url,
      status: row.status,
      paymentStatus: row.payment_status,
      problem: row.problem,
      plan: row.plan,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      progressPercent: row.progress_percent,
      pagesChecked: row.pages_checked,
      pagesDiscovered: row.pages_discovered,
      pagesNotCrawled: row.pages_not_crawled,
      crawlErrors: row.crawl_errors,
      urlsBlockedByRobots: row.urls_blocked_by_robots,
      errorMessage: row.error_message,
      reportUrl:
        row.status === 'complete'
          ? row.access_mode === 'private' && accessToken
            ? `/technical-seo/report/${scanId}/?key=${encodeURIComponent(accessToken)}`
            : row.access_mode === 'public'
              ? `/technical-seo/report/${scanId}/`
              : null
          : null,
    }

    if (summaryOnly || row.status !== 'complete' || !row.report_json) {
      return NextResponse.json(base)
    }

    const result = row.report_json as CrawlResult
    const problem = row.problem as DiagnosticProblem

    return NextResponse.json({
      ...base,
      result: {
        ...result,
        requestedProblem: problem,
        requestedPlan: row.plan,
        diagnosticFocus: {
          id: problem,
          label: PROBLEM_LABELS[problem],
          matchedFindings: result.findings.length,
        },
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to read scan status.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
