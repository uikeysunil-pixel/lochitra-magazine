import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { sql } from './db'
import type {
  CrawlCheckpoint,
  CrawlPage,
  CrawlResult,
  DiagnosticProblem,
  Finding,
  PlanId,
  ScanResult,
} from './types'

export async function getScanRecord(scanId: string) {
  const rows = await sql`
    select
      id,
      website_url,
      final_url,
      problem,
      plan,
      access_mode,
      report_token_hash,
      payment_status,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      payment_provider,
      payment_reference,
      payment_transaction_id,
      payment_currency,
      customer_email,
      paid_at,
      background_event_sent_at,
      status,
      max_urls,
      pages_discovered,
      pages_checked,
      pages_not_crawled,
      urls_blocked_by_robots,
      crawl_errors,
      progress_percent,
      started_at,
      completed_at,
      error_message,
      report_json,
      checkpoint_json,
      created_at,
      updated_at
    from seo_scans
    where id = ${scanId}::uuid
    limit 1
  `

  return rows[0] ?? null
}

export async function listRecentScans(limit = 10) {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)))
  return sql`
    select
      id,
      website_url,
      problem,
      plan,
      status,
      pages_checked,
      progress_percent,
      created_at,
      completed_at
    from seo_scans
    order by created_at desc
    limit ${safeLimit}
  `
}

export function createReportAccessToken() {
  return randomBytes(32).toString('base64url')
}

export function hashReportAccessToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function verifyReportAccessToken(
  token: string | null | undefined,
  storedHash: string | null | undefined
) {
  if (!token || !storedHash) return false

  const candidate = Buffer.from(hashReportAccessToken(token), 'hex')
  const expected = Buffer.from(storedHash, 'hex')

  if (candidate.length !== expected.length) return false

  return timingSafeEqual(candidate, expected)
}

export async function createScanRecord(input: {
  scanId: string
  websiteUrl: string
  problem: DiagnosticProblem
  plan: PlanId
  maxUrls: number
  accessMode?: 'public' | 'private'
  reportTokenHash?: string | null
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  stripeCheckoutSessionId?: string | null
  stripePaymentIntentId?: string | null
  paymentProvider?: string | null
  paymentReference?: string | null
  paymentTransactionId?: string | null
  paymentCurrency?: string | null
  customerEmail?: string | null
  paidAt?: string | null
  backgroundEventSentAt?: string | null
  initialStatus?: 'awaiting_payment' | 'queued'
}) {
  const rows = await sql`
    insert into seo_scans (
      id,
      website_url,
      problem,
      plan,
      access_mode,
      report_token_hash,
      payment_status,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      payment_provider,
      payment_reference,
      payment_transaction_id,
      payment_currency,
      customer_email,
      paid_at,
      background_event_sent_at,
      status,
      max_urls
    )
    values (
      ${input.scanId}::uuid,
      ${input.websiteUrl},
      ${input.problem},
      ${input.plan},
      ${input.accessMode ?? 'public'},
      ${input.reportTokenHash ?? null},
      ${input.paymentStatus ?? 'unpaid'},
      ${input.stripeCheckoutSessionId ?? null},
      ${input.stripePaymentIntentId ?? null},
      ${input.paymentProvider ?? null},
      ${input.paymentReference ?? null},
      ${input.paymentTransactionId ?? null},
      ${input.paymentCurrency ?? null},
      ${input.customerEmail ?? null},
      ${input.paidAt ?? null},
      ${input.backgroundEventSentAt ?? null},
      ${input.initialStatus ?? 'queued'},
      ${input.maxUrls}
    )
    returning id
  `

  return rows[0]?.id as string
}

export async function markCheckoutSessionCreated(scanId: string, checkoutSessionId: string) {
  await sql`
    update seo_scans
    set
      stripe_checkout_session_id = ${checkoutSessionId},
      payment_status = 'pending',
      updated_at = now()
    where id = ${scanId}::uuid
  `
}

export async function markCheckoutFailed(
  scanId: string,
  checkoutSessionId: string,
  message: string
) {
  await sql`
    update seo_scans
    set
      payment_status = 'failed',
      status = 'cancelled',
      error_message = ${message},
      updated_at = now()
    where id = ${scanId}::uuid
      and stripe_checkout_session_id = ${checkoutSessionId}
      and payment_status <> 'paid'
  `
}

export async function markCheckoutCancelled(scanId: string, message: string) {
  await sql`
    update seo_scans
    set
      payment_status = 'failed',
      status = 'cancelled',
      error_message = ${message},
      updated_at = now()
    where id = ${scanId}::uuid
      and status = 'awaiting_payment'
  `
}

export async function markCheckoutPaid(input: {
  scanId: string
  checkoutSessionId: string
  paymentIntentId?: string | null
  customerEmail?: string | null
}) {
  const rows = await sql`
    update seo_scans
    set
      payment_status = 'paid',
      stripe_checkout_session_id = ${input.checkoutSessionId},
      stripe_payment_intent_id = coalesce(
        ${input.paymentIntentId ?? null},
        stripe_payment_intent_id
      ),
      customer_email = coalesce(${input.customerEmail ?? null}, customer_email),
      paid_at = coalesce(paid_at, now()),
      status = case
        when status = 'awaiting_payment' then 'queued'
        else status
      end,
      updated_at = now()
    where id = ${input.scanId}::uuid
      and stripe_checkout_session_id = ${input.checkoutSessionId}
    returning
      id,
      website_url,
      problem,
      plan,
      status,
      payment_status,
      background_event_sent_at
  `

  return rows[0] ?? null
}

export async function markPaymentOrderCreated(input: {
  scanId: string
  paymentProvider: 'paypal' | 'razorpay'
  paymentReference: string
  paymentCurrency: string
}) {
  const rows = await sql`
    update seo_scans
    set
      payment_provider = ${input.paymentProvider},
      payment_reference = ${input.paymentReference},
      payment_currency = ${input.paymentCurrency},
      payment_status = 'pending',
      updated_at = now()
    where id = ${input.scanId}::uuid
      and status = 'awaiting_payment'
      and payment_status = 'pending'
      and payment_provider is null
      and payment_reference is null
    returning
      id,
      website_url,
      problem,
      plan,
      status,
      payment_status,
      payment_provider,
      payment_reference,
      payment_currency,
      background_event_sent_at
  `

  return rows[0] ?? null
}

export async function markPaymentPaid(input: {
  scanId: string
  paymentProvider: 'paypal' | 'razorpay'
  paymentReference: string
  paymentTransactionId?: string | null
  customerEmail?: string | null
}) {
  const rows = await sql`
    update seo_scans
    set
      payment_status = 'paid',
      payment_provider = ${input.paymentProvider},
      payment_reference = ${input.paymentReference},
      payment_transaction_id = coalesce(
        ${input.paymentTransactionId ?? null},
        payment_transaction_id
      ),
      customer_email = coalesce(${input.customerEmail ?? null}, customer_email),
      paid_at = coalesce(paid_at, now()),
      status = case
        when status = 'awaiting_payment' then 'queued'
        else status
      end,
      updated_at = now()
    where id = ${input.scanId}::uuid
      and payment_provider = ${input.paymentProvider}
      and payment_reference = ${input.paymentReference}
      and payment_status = 'pending'
    returning
      id,
      website_url,
      problem,
      plan,
      status,
      payment_status,
      background_event_sent_at
  `

  return rows[0] ?? null
}

export async function markPaymentFailed(
  scanId: string,
  paymentProvider: 'paypal' | 'razorpay',
  paymentReference: string,
  message: string
) {
  await sql`
    update seo_scans
    set
      payment_status = 'failed',
      status = 'cancelled',
      error_message = ${message},
      updated_at = now()
    where id = ${scanId}::uuid
      and payment_provider = ${paymentProvider}
      and payment_reference = ${paymentReference}
      and payment_status <> 'paid'
  `
}

export async function markBackgroundEventSent(scanId: string) {
  await sql`
    update seo_scans
    set
      background_event_sent_at = coalesce(background_event_sent_at, now()),
      updated_at = now()
    where id = ${scanId}::uuid
  `
}

export async function markScanRunning(scanId: string) {
  await sql`
    update seo_scans
    set
      status = 'running',
      started_at = coalesce(started_at, now()),
      updated_at = now()
    where id = ${scanId}::uuid
      and status not in ('complete', 'cancelled', 'failed')
  `
}

async function persistCrawledPages(scanId: string, result: CrawlResult) {
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
        result_json,
        updated_at
      )
      values (
        ${scanId}::uuid,
        ${page.url},
        ${page.finalUrl},
        ${page.state},
        ${page.depth ?? 0},
        1,
        ${page.httpStatus},
        ${page.durationMs},
        now(),
        ${page.resultJson ? JSON.stringify(page.resultJson) : null}::jsonb,
        now()
      )
      on conflict (scan_id, normalized_url) do update set
        url = excluded.url,
        state = excluded.state,
        attempts = excluded.attempts,
        depth = excluded.depth,
        http_status = excluded.http_status,
        duration_ms = excluded.duration_ms,
        scanned_at = excluded.scanned_at,
        result_json = coalesce(excluded.result_json, seo_scan_urls.result_json),
        updated_at = now()
    `
  }
}

export async function saveScanCheckpoint(
  input: {
    scanId: string
    checkpoint: CrawlCheckpoint
    newPages: CrawlPage[]
    pagesChecked: number
    pagesDiscovered: number
    progressPercent: number
    expectedSequence?: number | null
    legacyPages?: ScanResult[]
  },
  deps?: { sql?: typeof sql }
): Promise<boolean> {
  const sqlClient = deps?.sql ?? sql
  const expectedSeq =
    input.expectedSequence !== undefined
      ? input.expectedSequence
      : input.checkpoint.sequence === 0
        ? null
        : input.checkpoint.sequence - 1

  // Extract and normalize any legacy page results from checkpoint or explicit legacyPages input
  const candidateLegacy: ScanResult[] = [
    ...(input.checkpoint.pageResults ?? []),
    ...(input.legacyPages ?? []),
  ]

  const legacyScanResults: ScanResult[] = []
  const seenLegacyUrls = new Set<string>()

  for (let i = 0; i < candidateLegacy.length; i++) {
    const page = candidateLegacy[i]
    if (!page) continue
    const key = page.finalUrl || page.url
    if (!seenLegacyUrls.has(key)) {
      seenLegacyUrls.add(key)
      if (typeof page.pagesChecked !== 'number') {
        page.pagesChecked = i + 1
      }
      legacyScanResults.push(page)
    }
  }

  const depthMap = input.checkpoint.pageDepthMap
    ? input.checkpoint.pageDepthMap instanceof Map
      ? input.checkpoint.pageDepthMap
      : new Map(input.checkpoint.pageDepthMap)
    : null

  const legacyCrawlPages: CrawlPage[] = legacyScanResults.map((p) => ({
    url: p.url,
    finalUrl: p.finalUrl,
    httpStatus: p.httpStatus,
    durationMs: p.durationMs,
    findingsCount: p.findings?.length ?? 0,
    state: p.httpStatus >= 400 ? 'failed' : 'complete',
    depth: depthMap?.get(p.finalUrl) ?? depthMap?.get(p.url) ?? null,
    resultJson: p,
  }))

  // Combine legacy and new pages, preserving legacy order and avoiding duplicates
  const pagesToPersist: CrawlPage[] = []
  const seenPersistUrls = new Set<string>()

  // New pages override legacy if duplicate URL exists
  const newUrls = new Set(input.newPages.map((p) => p.finalUrl || p.url))

  for (const page of legacyCrawlPages) {
    const key = page.finalUrl || page.url
    if (!newUrls.has(key) && !seenPersistUrls.has(key)) {
      seenPersistUrls.add(key)
      pagesToPersist.push(page)
    }
  }

  for (const page of input.newPages) {
    const key = page.finalUrl || page.url
    if (!seenPersistUrls.has(key)) {
      seenPersistUrls.add(key)
      pagesToPersist.push(page)
    }
  }

  // 1. FIRST: Persist all page results (legacy + new) to seo_scan_urls.result_json using idempotent ON CONFLICT
  for (const page of pagesToPersist) {
    await sqlClient`
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
        result_json,
        updated_at
      )
      values (
        ${input.scanId}::uuid,
        ${page.url},
        ${page.finalUrl},
        ${page.state},
        ${page.depth ?? 0},
        1,
        ${page.httpStatus},
        ${page.durationMs},
        now(),
        ${page.resultJson ? JSON.stringify(page.resultJson) : null}::jsonb,
        now()
      )
      on conflict (scan_id, normalized_url) do update set
        url = excluded.url,
        state = excluded.state,
        attempts = excluded.attempts,
        depth = excluded.depth,
        http_status = excluded.http_status,
        duration_ms = excluded.duration_ms,
        scanned_at = excluded.scanned_at,
        result_json = coalesce(excluded.result_json, seo_scan_urls.result_json),
        updated_at = now()
    `
  }

  // 2. Prepare lean checkpoint: ensure pageResults and internalInboundGraph are eliminated from checkpoint_json
  const leanCheckpoint: CrawlCheckpoint = { ...input.checkpoint }
  delete leanCheckpoint.pageResults
  delete leanCheckpoint.internalInboundGraph

  // 3. THEN: Perform the CAS checkpoint update on seo_scans with leanCheckpoint
  const result = await (expectedSeq === null
    ? sqlClient`
        update seo_scans
        set
          pages_checked = ${input.pagesChecked},
          pages_discovered = ${input.pagesDiscovered},
          progress_percent = ${input.progressPercent},
          checkpoint_json = ${JSON.stringify(leanCheckpoint)}::jsonb,
          updated_at = now()
        where id = ${input.scanId}::uuid
          and checkpoint_json is null
        returning id
      `
    : sqlClient`
        update seo_scans
        set
          pages_checked = ${input.pagesChecked},
          pages_discovered = ${input.pagesDiscovered},
          progress_percent = ${input.progressPercent},
          checkpoint_json = ${JSON.stringify(leanCheckpoint)}::jsonb,
          updated_at = now()
        where id = ${input.scanId}::uuid
          and checkpoint_json is not null
          and (checkpoint_json->>'sequence')::int = ${expectedSeq}
        returning id
      `)

  if (result.length === 0) {
    return false
  }

  return true
}

export async function getScanCheckpoint(
  scanId: string,
  deps?: { sql?: typeof sql }
): Promise<CrawlCheckpoint | null> {
  const sqlClient = deps?.sql ?? sql
  const rows = await sqlClient`
    select checkpoint_json
    from seo_scans
    where id = ${scanId}::uuid
    limit 1
  `

  return (rows[0]?.checkpoint_json as CrawlCheckpoint) ?? null
}

export async function getScanPageResults(
  scanId: string,
  batchSize = 50,
  deps?: { sql?: typeof sql }
): Promise<ScanResult[]> {
  const sqlClient = deps?.sql ?? sql
  const safeLimit = Math.max(1, Math.min(100, Math.floor(batchSize)))
  const results: ScanResult[] = []
  let offset = 0

  while (true) {
    const rows = await sqlClient`
      select result_json
      from seo_scan_urls
      where scan_id = ${scanId}::uuid
        and result_json is not null
      order by coalesce((result_json->>'pagesChecked')::int, 0) asc, id asc
      limit ${safeLimit}
      offset ${offset}
    `

    if (rows.length === 0) break

    for (const row of rows) {
      if (row.result_json) {
        results.push(row.result_json as ScanResult)
      }
    }

    if (rows.length < safeLimit) break
    offset += rows.length
  }

  return results
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
      and status not in ('cancelled', 'failed')
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
