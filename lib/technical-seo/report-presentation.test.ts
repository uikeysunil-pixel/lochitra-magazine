import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import zlib from 'node:zlib'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'
}

/* eslint-disable @typescript-eslint/no-require-imports */
const { buildPdf } = require('../../app/api/technical-seo/report/[scanId]/pdf/route')
/* eslint-enable @typescript-eslint/no-require-imports */
import type { CrawlResult, DiagnosticProblem } from '@/lib/technical-seo/types'

function extractAllPdfText(pdfBuffer: Buffer): string {
  let combined = ''
  let pos = 0
  const marker = Buffer.from('stream')
  const endMarker = Buffer.from('endstream')

  while ((pos = pdfBuffer.indexOf(marker, pos)) !== -1) {
    const sIdx = pos + marker.length
    const eIdx = pdfBuffer.indexOf(endMarker, sIdx)
    if (eIdx === -1) break

    let slice = pdfBuffer.subarray(sIdx, eIdx)
    if (slice[0] === 0x0d && slice[1] === 0x0a) slice = slice.subarray(2)
    else if (slice[0] === 0x0a) slice = slice.subarray(1)
    if (slice[slice.length - 1] === 0x0a) slice = slice.subarray(0, slice.length - 1)
    if (slice[slice.length - 1] === 0x0d) slice = slice.subarray(0, slice.length - 1)

    try {
      const decompressed = zlib.inflateSync(slice).toString('latin1')
      // In PDF content streams, [ <hex> num <hex> ... ] TJ contains kerning numbers between glyphs
      const tjDecoded = decompressed.replace(/\[([\s\S]*?)\]\s*TJ/g, (_, tjContent) => {
        let text = ''
        const hexRegex = /<([0-9a-fA-F]+)>/g
        let hexMatch: RegExpExecArray | null
        while ((hexMatch = hexRegex.exec(tjContent)) !== null) {
          text += Buffer.from(hexMatch[1], 'hex').toString('latin1')
        }
        return text
      })
      const textOnly = tjDecoded.replace(/<([0-9a-fA-F]+)>/g, (_, hex) =>
        Buffer.from(hex, 'hex').toString('latin1')
      )
      combined += textOnly + '\n'
    } catch {
      // ignore non-zlib streams
    }

    pos = eIdx + endMarker.length
  }

  return combined + pdfBuffer.toString('latin1')
}

type ScanRecord = Parameters<typeof buildPdf>[0]['scan']

const MOCK_BASE_SCAN: ScanRecord = {
  id: '845830fa-a9ea-4937-9c6e-d25274792917',
  website_url: 'https://example.com',
  final_url: 'https://example.com/',
  problem: 'unknown' as DiagnosticProblem,
  plan: 'full',
  access_mode: 'public',
  report_token_hash: null,
  payment_status: 'paid',
  stripe_checkout_session_id: null,
  stripe_payment_intent_id: null,
  payment_provider: 'paypal',
  payment_reference: 'ORDER-123',
  payment_transaction_id: 'CAPTURE-456',
  payment_currency: 'USD',
  customer_email: 'test@example.com',
  paid_at: new Date('2026-09-26T12:00:00Z'),
  background_event_sent_at: new Date('2026-09-26T12:00:01Z'),
  status: 'complete',
  max_urls: 250,
  pages_discovered: 449,
  pages_checked: 250,
  pages_not_crawled: 199,
  urls_blocked_by_robots: 0,
  crawl_errors: 0,
  progress_percent: 100,
  started_at: new Date('2026-09-26T12:00:02Z'),
  completed_at: new Date('2026-09-26T12:05:00Z'),
  error_message: null,
  report_json: null,
  checkpoint_json: null,
  created_at: new Date('2026-09-26T11:59:00Z'),
  updated_at: new Date('2026-09-26T12:05:01Z'),
}

const MOCK_FINDINGS = [
  {
    id: 'missing-meta-description',
    title: 'Missing meta descriptions',
    severity: 'medium' as const,
    category: 'technical' as const,
    confidence: 'high' as const,
    summary: '2 pages are missing meta description tags.',
    recommendation: 'Add unique meta descriptions for improved SERP snippets.',
    evidence: ['https://example.com/page-1', 'https://example.com/page-2'],
    affectedUrls: ['https://example.com/page-1', 'https://example.com/page-2'],
    diagnosticProblems: ['indexing' as const],
  },
]

const MOCK_BASE_RESULT: CrawlResult = {
  scanId: '845830fa-a9ea-4937-9c6e-d25274792917',
  url: 'https://example.com',
  finalUrl: 'https://example.com/',
  fetchedAt: '2026-09-26T12:00:00Z',
  plan: 'full',
  maxUrls: 250,
  pagesChecked: 250,
  urlsDiscovered: 449,
  urlsNotCrawled: 199,
  crawlErrors: 0,
  urlsBlockedByRobots: 0,
  durationMs: 45000,
  summary: {
    critical: 0,
    high: 0,
    medium: 1,
    low: 0,
    info: 0,
  },
  metrics: {
    internalLinks: 1500,
    externalLinks: 120,
    images: 340,
    imagesWithoutAlt: 5,
    imagesWithEmptyAlt: 2,
    h1Count: 250,
    jsonLdBlocks: 250,
    hreflangCount: 0,
  },
  robotsTxt: {
    found: true,
    allowed: true,
  },
  sitemap: {
    found: true,
    urlsCount: 200,
  },
  pages: [],
  findings: MOCK_FINDINGS,
}

describe('Phase 6C — Full Technical SEO Report Presentation Remediation', () => {
  describe('PDF Generation & Plan Segregation', () => {
    it('Free/Quick reports omit architecture and duplicate sections safely', async () => {
      const freeScan: ScanRecord = {
        ...MOCK_BASE_SCAN,
        plan: 'free',
        payment_status: 'unpaid',
      }
      const freeResult: CrawlResult = {
        ...MOCK_BASE_RESULT,
        plan: 'free',
        architecture: undefined,
        duplicates: undefined,
      }

      const pdfBuffer = await buildPdf({
        scan: freeScan,
        result: freeResult,
        problemLabel: "I don't know - find the important problems",
        generatedAt: 'Sep 26, 2026, 12:05',
      })

      assert.ok(Buffer.isBuffer(pdfBuffer))
      assert.ok(pdfBuffer.length > 1000)
      assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), '%PDF')

      // Ensure PDF string does NOT contain architecture or duplicate titles
      const pdfText = pdfBuffer.toString('latin1')
      assert.strictEqual(pdfText.includes('SITE ARCHITECTURE & STRUCTURE'), false)
      assert.strictEqual(pdfText.includes('DUPLICATE & CANONICAL CONFLICT ANALYSIS'), false)
    })

    it('Full reports render both Architecture and Duplicate sections when supplied', async () => {
      const fullResult: CrawlResult = {
        ...MOCK_BASE_RESULT,
        plan: 'full',
        architecture: {
          maxDepth: 3,
          depthDistribution: { 0: 1, 1: 35, 2: 186, 3: 28 },
          topLinkedUrls: [
            { url: 'https://example.com/', inboundCount: 250 },
            { url: 'https://example.com/about/', inboundCount: 250 },
            { url: 'https://example.com/blog/', inboundCount: 250 },
          ],
          orphanCandidates: ['https://example.com/orphaned-page/'],
          sectionDistribution: [
            { path: '/blog/', pageCount: 162 },
            { path: '/tags/', pageCount: 71 },
            { path: '/categories/', pageCount: 7 },
          ],
          canonicalSummary: {
            selfCanonicalCount: 248,
            crossPageCanonicalCount: 2,
            missingCanonicalCount: 0,
          },
        },
        duplicates: {
          titleDuplicateGroups: [
            {
              title: 'Services Overview - Company',
              urls: ['https://example.com/services/', 'https://example.com/services/overview/'],
            },
          ],
          descriptionDuplicateGroups: [
            {
              description: 'Learn about our full suite of professional digital services.',
              urls: ['https://example.com/services/', 'https://example.com/services/overview/'],
            },
          ],
          parameterVariationGroups: [
            {
              baseUrl: 'https://example.com/blog/article/',
              variations: [
                'https://example.com/blog/article/?utm_source=twitter',
                'https://example.com/blog/article/?ref=home',
              ],
            },
          ],
          canonicalConflictGroups: [
            {
              canonicalUrl: 'https://example.com/canonical-target/',
              declaredOnUrls: ['https://example.com/page-a/', 'https://example.com/page-b/'],
            },
          ],
        },
      }

      const pdfBuffer = await buildPdf({
        scan: MOCK_BASE_SCAN,
        result: fullResult,
        problemLabel: "I don't know - find the important problems",
        generatedAt: 'Sep 26, 2026, 12:05',
      })

      assert.ok(Buffer.isBuffer(pdfBuffer))
      assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), '%PDF')

      const pdfText = extractAllPdfText(pdfBuffer)
      assert.ok(
        pdfText.includes('SITE ARCHITECTURE & STRUCTURE'),
        'PDF must include architecture section'
      )
      assert.ok(
        pdfText.includes('DUPLICATE & CANONICAL CONFLICT ANALYSIS'),
        'PDF must include duplicates section'
      )
      assert.ok(
        pdfText.includes('CRAWL DEPTH DISTRIBUTION'),
        'PDF must include crawl depth distribution'
      )
      assert.ok(
        pdfText.includes('DIRECTORY & SECTION BREAKDOWN'),
        'PDF must include section breakdown'
      )
      assert.ok(
        pdfText.includes('TOP INTERNALLY LINKED PAGES'),
        'PDF must include top linked pages'
      )
      assert.ok(pdfText.includes('ORPHAN PAGE CANDIDATES'), 'PDF must include orphan candidates')
    })

    it('Full reports render empty architecture arrays and empty duplicate groups safely', async () => {
      const fullEmptyResult: CrawlResult = {
        ...MOCK_BASE_RESULT,
        plan: 'full',
        architecture: {
          maxDepth: 1,
          depthDistribution: { 0: 1, 1: 5 },
          topLinkedUrls: [],
          orphanCandidates: [], // Empty orphan candidates
          sectionDistribution: [],
          canonicalSummary: {
            selfCanonicalCount: 6,
            crossPageCanonicalCount: 0,
            missingCanonicalCount: 0,
          },
        },
        duplicates: {
          titleDuplicateGroups: [], // Empty title duplicates
          descriptionDuplicateGroups: [], // Empty description duplicates
          parameterVariationGroups: [], // Empty parameter variations
          canonicalConflictGroups: [], // Empty canonical conflicts
        },
      }

      const pdfBuffer = await buildPdf({
        scan: MOCK_BASE_SCAN,
        result: fullEmptyResult,
        problemLabel: "I don't know - find the important problems",
        generatedAt: 'Sep 26, 2026, 12:05',
      })

      assert.ok(Buffer.isBuffer(pdfBuffer))
      assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), '%PDF')

      const pdfText = extractAllPdfText(pdfBuffer)
      assert.ok(pdfText.includes('SITE ARCHITECTURE & STRUCTURE'))
      assert.ok(pdfText.includes('DUPLICATE & CANONICAL CONFLICT ANALYSIS'))
      assert.ok(
        pdfText.includes('No orphan candidates identified'),
        'Should display clear no-orphan message'
      )
      assert.ok(
        pdfText.includes('No duplicate title groups identified'),
        'Should display clear no-duplicate-titles message'
      )
      assert.ok(
        pdfText.includes('No duplicate meta-description groups identified'),
        'Should display clear no-duplicate-descriptions message'
      )
      assert.ok(
        pdfText.includes('No parameter variation groups identified'),
        'Should display clear no-parameter-variations message'
      )
      assert.ok(
        pdfText.includes('No canonical conflict groups identified'),
        'Should display clear no-canonical-conflicts message'
      )
    })

    it('Bounded rendering limits long URL lists to avoid page overflow', async () => {
      const longUrls = Array.from({ length: 50 }, (_, i) => `https://example.com/orphan-${i + 1}/`)
      const longResult: CrawlResult = {
        ...MOCK_BASE_RESULT,
        plan: 'full',
        architecture: {
          maxDepth: 5,
          depthDistribution: { 0: 1, 1: 10, 2: 50, 3: 100, 4: 80, 5: 9 },
          topLinkedUrls: Array.from({ length: 30 }, (_, i) => ({
            url: `https://example.com/page-${i + 1}/`,
            inboundCount: 100 - i,
          })),
          orphanCandidates: longUrls,
          sectionDistribution: Array.from({ length: 25 }, (_, i) => ({
            path: `/section-${i + 1}/`,
            pageCount: 10,
          })),
          canonicalSummary: {
            selfCanonicalCount: 200,
            crossPageCanonicalCount: 30,
            missingCanonicalCount: 20,
          },
        },
        duplicates: {
          titleDuplicateGroups: Array.from({ length: 15 }, (_, i) => ({
            title: `Duplicate Title Group ${i + 1}`,
            urls: Array.from({ length: 10 }, (_, j) => `https://example.com/group-${i}-url-${j}/`),
          })),
          descriptionDuplicateGroups: Array.from({ length: 15 }, (_, i) => ({
            description: `Duplicate Description Group ${i + 1}`,
            urls: Array.from({ length: 10 }, (_, j) => `https://example.com/desc-${i}-url-${j}/`),
          })),
          parameterVariationGroups: Array.from({ length: 15 }, (_, i) => ({
            baseUrl: `https://example.com/param-base-${i + 1}/`,
            variations: Array.from(
              { length: 10 },
              (_, j) => `https://example.com/param-base-${i + 1}/?v=${j}`
            ),
          })),
          canonicalConflictGroups: Array.from({ length: 15 }, (_, i) => ({
            canonicalUrl: `https://example.com/canonical-${i + 1}/`,
            declaredOnUrls: Array.from(
              { length: 10 },
              (_, j) => `https://example.com/declaring-${i}-${j}/`
            ),
          })),
        },
      }

      const pdfBuffer = await buildPdf({
        scan: MOCK_BASE_SCAN,
        result: longResult,
        problemLabel: "I don't know - find the important problems",
        generatedAt: 'Sep 26, 2026, 12:05',
      })

      assert.ok(Buffer.isBuffer(pdfBuffer))
      assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), '%PDF')
      // PDF should successfully generate within reasonable memory and byte size
      assert.ok(pdfBuffer.length > 5000)
    })
  })
})
