import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { sql } from './db'
import type { CrawlResult, DiagnosticProblem, Finding, PlanId } from './types'

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
