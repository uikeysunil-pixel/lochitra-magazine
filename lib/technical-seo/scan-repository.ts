import { sql } from './db'
import type { CrawlResult, DiagnosticProblem, Finding, PlanId } from './types'

export async function createScanRecord(input: {
  scanId: string
  websiteUrl: string
  problem: DiagnosticProblem
  plan: PlanId
  maxUrls: number
}) {
  const rows = await sql`
    insert into seo_scans (
      id,
      website_url,
      problem,
      plan,
      status,
      max_urls
    )
    values (
      ${input.scanId}::uuid,
      ${input.websiteUrl},
      ${input.problem},
      ${input.plan},
      'queued',
      ${input.maxUrls}
    )
    returning id
  `

  return rows[0]?.id as string
}

export async function markScanRunning(scanId: string) {
  await sql`
    update seo_scans
    set
      status = 'running',
      started_at = coalesce(started_at, now()),
      updated_at = now()
    where id = ${scanId}::uuid
  `
}

async function persistCrawledPages(scanId: string, result: CrawlResult) {
  await sql`
    delete from seo_scan_urls
    where scan_id = ${scanId}::uuid
  `

  for (const page of result.pages) {
    await sql`
      insert into seo_scan_urls (
        scan_id,
        url,
        normalized_url,
        state,
        depth,
        attempts,
        http_status,
        duration_ms,
        scanned_at,
        updated_at
      )
      values (
        ${scanId}::uuid,
        ${page.url},
        ${page.finalUrl},
        ${page.state},
        0,
        1,
        ${page.httpStatus},
        ${page.durationMs},
        now(),
        now()
      )
      on conflict (scan_id, normalized_url) do update set
        url = excluded.url,
        state = excluded.state,
        attempts = excluded.attempts,
        http_status = excluded.http_status,
        duration_ms = excluded.duration_ms,
        scanned_at = excluded.scanned_at,
        updated_at = now()
    `
  }
}

export async function completeScanRecord(scanId: string, result: CrawlResult) {
  await persistCrawledPages(scanId, result)

  await sql`
    delete from seo_scan_findings
    where scan_id = ${scanId}::uuid
  `

  for (const finding of result.findings) {
    await insertFinding(scanId, finding)
  }

  await sql`
    update seo_scans
    set
      final_url = ${result.finalUrl},
      status = 'complete',
      pages_discovered = ${result.urlsDiscovered},
      pages_checked = ${result.pagesChecked},
      pages_not_crawled = ${result.urlsNotCrawled},
      urls_blocked_by_robots = ${result.urlsBlockedByRobots},
      crawl_errors = ${result.crawlErrors},
      progress_percent = 100,
      completed_at = now(),
      report_json = ${JSON.stringify(result)}::jsonb,
      updated_at = now()
    where id = ${scanId}::uuid
  `
}

export async function failScanRecord(scanId: string, message: string) {
  await sql`
    update seo_scans
    set
      status = 'failed',
      error_message = ${message},
      updated_at = now()
    where id = ${scanId}::uuid
  `
}

async function insertFinding(scanId: string, finding: Finding) {
  const evidence = finding.evidence || []
  const affectedUrls = finding.affectedUrls || []

  await sql`
    insert into seo_scan_findings (
      scan_id,
      finding_key,
      severity,
      confidence,
      title,
      category,
      summary,
      recommendation,
      diagnostic_problems,
      affected_urls,
      evidence
    )
    values (
      ${scanId}::uuid,
      ${finding.id},
      ${finding.severity},
      ${finding.confidence},
      ${finding.title},
      ${finding.category},
      ${finding.summary},
      ${finding.recommendation},
      ${JSON.stringify(finding.diagnosticProblems)}::jsonb,
      ${JSON.stringify(affectedUrls)}::jsonb,
      ${JSON.stringify(evidence)}::jsonb
    )
    on conflict (scan_id, finding_key) do update set
      severity = excluded.severity,
      confidence = excluded.confidence,
      title = excluded.title,
      category = excluded.category,
      summary = excluded.summary,
      recommendation = excluded.recommendation,
      diagnostic_problems = excluded.diagnostic_problems,
      affected_urls = excluded.affected_urls,
      evidence = excluded.evidence,
      updated_at = now()
  `
}
