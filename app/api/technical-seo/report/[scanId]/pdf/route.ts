import PDFDocument from 'pdfkit'
import { NextResponse } from 'next/server'
import { getScanRecord, verifyReportAccessToken } from '@/lib/technical-seo/scan-repository'
import type {
  ArchitectureSummary,
  CrawlResult,
  DiagnosticProblem,
  DuplicateCandidateSummary,
  Finding,
} from '@/lib/technical-seo/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ScanRecord = NonNullable<Awaited<ReturnType<typeof getScanRecord>>>

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
  unknown: "I don't know - find the important problems",
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Quick Check',
  quick: 'Targeted Troubleshoot',
  full: 'Full Troubleshoot',
  deep: 'Deep Investigation',
}

const PALETTE = {
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  brand: '#2563EB',
  brandDark: '#1D4ED8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  surfaceBg: '#F8FAFC',
  severities: {
    critical: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', accent: '#DC2626' },
    high: { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412', accent: '#EA580C' },
    medium: { bg: '#FEFCE8', border: '#FEF08A', text: '#854D0E', accent: '#D97706' },
    low: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', accent: '#2563EB' },
    info: { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', accent: '#64748B' },
  },
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function cleanText(value: string | null | undefined): string {
  if (!value) return ''
  return String(value)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\t\n]/g, (char) => (char === '\u2022' ? '•' : ''))
}

function ensureSpace(doc: PDFKit.PDFDocument, requiredHeight: number) {
  const maxContentY = doc.page.height - doc.page.margins.bottom - 12
  if (doc.y + requiredHeight > maxContentY) {
    doc.addPage()
  }
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  scan: ScanRecord,
  problemLabel: string,
  generatedAt: string
) {
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  let y = doc.page.margins.top

  // Brand line & Report ID
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PALETTE.brand)
  doc.text('LOCITRA', left, y, { continued: true })
  doc.font('Helvetica-Bold').fillColor(PALETTE.textMuted)
  doc.text('  |  TECHNICAL SEO AUDIT REPORT', { continued: false })

  doc.font('Helvetica').fontSize(7.5).fillColor(PALETTE.textMuted)
  doc.text(`ID: ${scan.id}`, left, y + 1, { width, align: 'right' })

  y += 16

  // Target website URL
  doc.font('Helvetica-Bold').fontSize(16).fillColor(PALETTE.textPrimary)
  doc.text(cleanText(scan.website_url), left, y, { width, lineGap: 1 })
  y = doc.y + 6

  // Metadata strip
  const metaHeight = 20
  doc.roundedRect(left, y, width, metaHeight, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)

  const focusWidth = Math.floor(width * 0.44)
  const planWidth = Math.floor(width * 0.24)
  const planLabel = PLAN_LABELS[scan.plan] ?? scan.plan ?? 'Quick Check'

  doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textMuted)
  doc.text('DIAGNOSTIC FOCUS: ', left + 8, y + 6, { continued: true })
  doc.font('Helvetica').fillColor(PALETTE.textPrimary)
  doc.text(cleanText(problemLabel), { width: focusWidth - 10, lineBreak: false })

  doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textMuted)
  doc.text('PLAN: ', left + focusWidth + 8, y + 6, { continued: true })
  doc.font('Helvetica').fillColor(PALETTE.textPrimary)
  doc.text(cleanText(planLabel), { width: planWidth - 10, lineBreak: false })

  doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textMuted)
  doc.text('GENERATED: ', left + focusWidth + planWidth + 8, y + 6, { continued: true })
  doc.font('Helvetica').fillColor(PALETTE.textPrimary)
  doc.text(`${generatedAt} UTC`, {
    width: width - (focusWidth + planWidth) - 16,
    lineBreak: false,
  })

  y += metaHeight + 12

  doc
    .moveTo(left, y)
    .lineTo(left + width, y)
    .lineWidth(0.5)
    .strokeColor(PALETTE.border)
    .stroke()
  doc.y = y + 10
}

function drawSummaryCards(doc: PDFKit.PDFDocument, summary: CrawlResult['summary']) {
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const y = doc.y

  doc.font('Helvetica-Bold').fontSize(8).fillColor(PALETTE.textMuted)
  doc.text('EXECUTIVE SUMMARY', left, y, { lineBreak: true })
  const cardsY = doc.y + 5

  const severities = [
    { key: 'critical', label: 'CRITICAL', count: summary?.critical ?? 0 },
    { key: 'high', label: 'HIGH', count: summary?.high ?? 0 },
    { key: 'medium', label: 'MEDIUM', count: summary?.medium ?? 0 },
    { key: 'low', label: 'LOW', count: summary?.low ?? 0 },
    { key: 'info', label: 'INFO', count: summary?.info ?? 0 },
  ] as const

  const gap = 8
  const cardWidth = (width - gap * 4) / 5
  const cardHeight = 40

  severities.forEach((sev, i) => {
    const cardX = left + i * (cardWidth + gap)
    const config = PALETTE.severities[sev.key] || PALETTE.severities.info

    doc.roundedRect(cardX, cardsY, cardWidth, cardHeight, 4).fillAndStroke(config.bg, config.border)

    doc.font('Helvetica-Bold').fontSize(16).fillColor(config.accent)
    doc.text(String(sev.count), cardX, cardsY + 6, {
      width: cardWidth,
      align: 'center',
      lineBreak: false,
    })

    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(config.text)
    doc.text(sev.label, cardX, cardsY + 26, {
      width: cardWidth,
      align: 'center',
      lineBreak: false,
    })
  })

  doc.y = cardsY + cardHeight + 12
}

function drawCoverage(doc: PDFKit.PDFDocument, scan: ScanRecord, result: CrawlResult) {
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const y = doc.y

  doc.font('Helvetica-Bold').fontSize(8).fillColor(PALETTE.textMuted)
  doc.text('SCAN COVERAGE', left, y, { lineBreak: true })
  const boxY = doc.y + 5

  const leftMetrics = [
    { label: 'Pages checked', value: String(scan.pages_checked ?? result.pagesChecked ?? 0) },
    {
      label: 'URLs discovered',
      value: String(scan.pages_discovered ?? result.urlsDiscovered ?? 0),
    },
    {
      label: 'Pages not crawled',
      value: String(scan.pages_not_crawled ?? result.urlsNotCrawled ?? 0),
    },
    { label: 'Crawl errors', value: String(scan.crawl_errors ?? result.crawlErrors ?? 0) },
    {
      label: 'Robots blocked',
      value: String(scan.urls_blocked_by_robots ?? result.urlsBlockedByRobots ?? 0),
    },
    { label: 'Internal links', value: String(result.metrics?.internalLinks ?? 0) },
  ]

  const rightMetrics = [
    { label: 'External links', value: String(result.metrics?.externalLinks ?? 0) },
    { label: 'Images', value: String(result.metrics?.images ?? 0) },
    { label: 'Images without alt', value: String(result.metrics?.imagesWithoutAlt ?? 0) },
    { label: 'JSON-LD blocks', value: String(result.metrics?.jsonLdBlocks ?? 0) },
    { label: 'robots.txt', value: result.robotsTxt?.found ? 'Found' : 'Not found' },
    { label: 'Sitemap', value: result.sitemap?.found ? 'Found' : 'Not found' },
  ]

  const rowCount = 6
  const rowHeight = 15
  const boxPadding = 6
  const boxHeight = rowCount * rowHeight + boxPadding * 2
  const colWidth = (width - 24) / 2

  doc.roundedRect(left, boxY, width, boxHeight, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)

  // Middle vertical divider
  const midX = left + width / 2
  doc
    .moveTo(midX, boxY + 4)
    .lineTo(midX, boxY + boxHeight - 4)
    .lineWidth(0.5)
    .strokeColor(PALETTE.border)
    .stroke()

  for (let r = 0; r < rowCount; r++) {
    const rowY = boxY + boxPadding + r * rowHeight

    if (r < rowCount - 1) {
      doc
        .moveTo(left + 8, rowY + rowHeight)
        .lineTo(midX - 8, rowY + rowHeight)
        .lineWidth(0.5)
        .strokeColor(PALETTE.borderLight)
        .stroke()
      doc
        .moveTo(midX + 8, rowY + rowHeight)
        .lineTo(left + width - 8, rowY + rowHeight)
        .lineWidth(0.5)
        .strokeColor(PALETTE.borderLight)
        .stroke()
    }

    // Left Column
    const leftItem = leftMetrics[r]
    doc.font('Helvetica').fontSize(7.5).fillColor(PALETTE.textMuted)
    doc.text(leftItem.label, left + 10, rowY + 3, { width: colWidth * 0.65, lineBreak: false })
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PALETTE.textPrimary)
    doc.text(leftItem.value, left + 10, rowY + 3, {
      width: colWidth - 10,
      align: 'right',
      lineBreak: false,
    })

    // Right Column
    const rightItem = rightMetrics[r]
    doc.font('Helvetica').fontSize(7.5).fillColor(PALETTE.textMuted)
    doc.text(rightItem.label, midX + 10, rowY + 3, { width: colWidth * 0.65, lineBreak: false })
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PALETTE.textPrimary)
    doc.text(rightItem.value, midX + 10, rowY + 3, {
      width: colWidth - 10,
      align: 'right',
      lineBreak: false,
    })
  }

  doc.y = boxY + boxHeight + 12
}

function estimateFindingHeight(
  doc: PDFKit.PDFDocument,
  finding: Finding,
  cardWidth: number
): number {
  const innerWidth = cardWidth - 24
  let h = 10

  // Meta row
  h += 14

  // Title
  doc.font('Helvetica-Bold').fontSize(10)
  h += doc.heightOfString(cleanText(finding.title), { width: innerWidth }) + 6

  // Summary
  h += 9
  doc.font('Helvetica').fontSize(7.5)
  h += doc.heightOfString(cleanText(finding.summary), { width: innerWidth, lineGap: 1.5 }) + 6

  // Evidence
  if (finding.evidence && finding.evidence.length > 0) {
    h += 9
    doc.font('Helvetica').fontSize(7.5)
    for (const ev of finding.evidence) {
      h += doc.heightOfString(cleanText(ev), { width: innerWidth - 12, lineGap: 1 }) + 3
    }
    h += 3
  }

  // Recommended Action
  h += 9
  doc.font('Helvetica').fontSize(7.5)
  h +=
    doc.heightOfString(cleanText(finding.recommendation), {
      width: innerWidth - 14,
      lineGap: 1.5,
    }) + 14

  h += 10
  return Math.ceil(h)
}

function drawFinding(doc: PDFKit.PDFDocument, finding: Finding, index: number) {
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const innerWidth = width - 24
  const cardHeight = estimateFindingHeight(doc, finding, width)
  const maxUsableHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom - 12

  if (cardHeight <= maxUsableHeight) {
    ensureSpace(doc, cardHeight)
  } else {
    ensureSpace(doc, 80)
  }

  const y = doc.y
  const sevKey = (finding.severity || 'info').toLowerCase() as keyof typeof PALETTE.severities
  const sev = PALETTE.severities[sevKey] || PALETTE.severities.info

  // Draw card container
  doc.roundedRect(left, y, width, cardHeight, 4).fillAndStroke('#FFFFFF', PALETTE.border)

  // Left accent bar
  doc.save()
  doc.roundedRect(left, y, 3.5, cardHeight, 2).fill(sev.accent)
  doc.restore()

  let curY = y + 8
  const contentLeft = left + 14

  // Metadata badge line
  const confidenceStr = (finding.confidence || 'HIGH').toUpperCase() + ' CONFIDENCE'
  const categoryStr = (finding.category || 'TECHNICAL').toUpperCase()
  const sevLabel = (finding.severity || 'INFO').toUpperCase()
  const metaText = `${index}.  ${sevLabel}  ·  ${categoryStr}  ·  ${confidenceStr}`

  doc.font('Helvetica-Bold').fontSize(7).fillColor(sev.accent)
  doc.text(metaText, contentLeft, curY, {
    width: innerWidth,
    lineBreak: false,
    characterSpacing: 0.3,
  })
  curY += 13

  // Finding title
  doc.font('Helvetica-Bold').fontSize(10).fillColor(PALETTE.textPrimary)
  doc.text(cleanText(finding.title), contentLeft, curY, { width: innerWidth, lineGap: 1 })
  curY = doc.y + 6

  // Summary section
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(PALETTE.textMuted)
  doc.text('SUMMARY', contentLeft, curY, { lineBreak: true, characterSpacing: 0.5 })
  curY = doc.y + 2

  doc.font('Helvetica').fontSize(7.5).fillColor(PALETTE.textSecondary)
  doc.text(cleanText(finding.summary), contentLeft, curY, { width: innerWidth, lineGap: 1.5 })
  curY = doc.y + 6

  // Evidence section
  if (finding.evidence && finding.evidence.length > 0) {
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(PALETTE.textMuted)
    doc.text('EVIDENCE', contentLeft, curY, { lineBreak: true, characterSpacing: 0.5 })
    curY = doc.y + 3

    doc.font('Helvetica').fontSize(7.5).fillColor(PALETTE.textSecondary)
    for (const ev of finding.evidence) {
      doc.circle(contentLeft + 3, curY + 4, 1.25).fill(sev.accent)
      doc.text(cleanText(ev), contentLeft + 10, curY, { width: innerWidth - 12, lineGap: 1 })
      curY = doc.y + 2
    }
    curY += 4
  }

  // Recommended Action section
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(PALETTE.brand)
  doc.text('RECOMMENDED ACTION', contentLeft, curY, { lineBreak: true, characterSpacing: 0.5 })
  curY = doc.y + 2

  const recText = cleanText(finding.recommendation)
  doc.font('Helvetica').fontSize(7.5)
  const recTextHeight = doc.heightOfString(recText, { width: innerWidth - 14, lineGap: 1.5 })

  doc
    .roundedRect(contentLeft, curY, innerWidth, recTextHeight + 8, 3)
    .fillAndStroke('#EFF6FF', '#DBEAFE')
  doc.fillColor(PALETTE.textPrimary)
  doc.text(recText, contentLeft + 7, curY + 4, { width: innerWidth - 14, lineGap: 1.5 })

  doc.y = y + cardHeight + 8
}

function drawFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange()
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right

  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index)
    const savedBottom = doc.page.margins.bottom
    doc.page.margins.bottom = 0

    const footerLineOffset = 28
    const footerTextOffset = 22
    const footerLineY = doc.page.height - footerLineOffset
    const footerTextY = doc.page.height - footerTextOffset

    doc
      .moveTo(left, footerLineY)
      .lineTo(left + width, footerLineY)
      .lineWidth(0.5)
      .strokeColor(PALETTE.border)
      .stroke()

    doc.font('Helvetica').fontSize(7).fillColor(PALETTE.textLight)
    doc.text('Locitra Technical SEO Report', left, footerTextY, {
      width,
      align: 'left',
      lineBreak: false,
    })

    doc.text(`Page ${index + 1} of ${range.count}`, left, footerTextY, {
      width,
      align: 'right',
      lineBreak: false,
    })

    doc.page.margins.bottom = savedBottom
  }
}

function drawArchitecture(doc: PDFKit.PDFDocument, architecture: ArchitectureSummary) {
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right

  ensureSpace(doc, 50)
  doc.font('Helvetica-Bold').fontSize(8).fillColor(PALETTE.textMuted)
  doc.text('SITE ARCHITECTURE & STRUCTURE', left, doc.y, { lineBreak: true })
  doc.y += 5

  // 1. Stat cards: Max Depth + Canonical Summary (4 cards)
  const gap = 8
  const cardWidth = (width - gap * 3) / 4
  const cardHeight = 36
  const cardsY = doc.y

  const archCards = [
    {
      label: 'MAX CRAWL DEPTH',
      value: `${architecture.maxDepth ?? 0} ${architecture.maxDepth === 1 ? 'click' : 'clicks'}`,
    },
    {
      label: 'SELF-CANONICAL',
      value: String(architecture.canonicalSummary?.selfCanonicalCount ?? 0),
    },
    {
      label: 'CROSS-PAGE CANONICAL',
      value: String(architecture.canonicalSummary?.crossPageCanonicalCount ?? 0),
    },
    {
      label: 'MISSING CANONICAL',
      value: String(architecture.canonicalSummary?.missingCanonicalCount ?? 0),
    },
  ]

  archCards.forEach((c, i) => {
    const cardX = left + i * (cardWidth + gap)
    doc
      .roundedRect(cardX, cardsY, cardWidth, cardHeight, 4)
      .fillAndStroke(PALETTE.surfaceBg, PALETTE.border)
    doc.font('Helvetica-Bold').fontSize(13).fillColor(PALETTE.textPrimary)
    doc.text(c.value, cardX, cardsY + 6, {
      width: cardWidth,
      align: 'center',
      lineBreak: false,
    })
    doc.font('Helvetica-Bold').fontSize(6).fillColor(PALETTE.textMuted)
    doc.text(c.label, cardX, cardsY + 22, {
      width: cardWidth,
      align: 'center',
      lineBreak: false,
    })
  })

  doc.y = cardsY + cardHeight + 10

  // 2. Crawl Depth Distribution
  const depthEntries = Object.entries(architecture.depthDistribution || {}).sort(
    ([a], [b]) => Number(a) - Number(b)
  )

  if (depthEntries.length > 0) {
    const totalPages = depthEntries.reduce((acc, [_, count]) => acc + count, 0)
    const boxHeight = 32
    ensureSpace(doc, boxHeight + 18)

    doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
    doc.text('CRAWL DEPTH DISTRIBUTION', left, doc.y, { lineBreak: true })
    doc.y += 3

    const dBoxY = doc.y
    doc
      .roundedRect(left, dBoxY, width, boxHeight, 4)
      .fillAndStroke(PALETTE.surfaceBg, PALETTE.border)

    const numCols = Math.min(depthEntries.length, 6)
    const colW = (width - 16) / numCols

    depthEntries.slice(0, numCols).forEach(([depth, count], idx) => {
      const pct = totalPages > 0 ? Math.round((count / totalPages) * 100) : 0
      const cX = left + 8 + idx * colW
      const label = depth === '0' ? 'Depth 0 (Root)' : `Depth ${depth}`
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor(PALETTE.textMuted)
      doc.text(label, cX, dBoxY + 5, { width: colW, lineBreak: false })
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PALETTE.textPrimary)
      doc.text(`${count} (${pct}%)`, cX, dBoxY + 16, { width: colW, lineBreak: false })
    })

    doc.y = dBoxY + boxHeight + 10
  }

  // 3. Section Distribution
  const sections = (architecture.sectionDistribution || []).slice(0, 8)
  if (sections.length > 0) {
    const rowH = 14
    const boxH = Math.ceil(sections.length / 2) * rowH + 10
    ensureSpace(doc, boxH + 18)

    doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
    doc.text('DIRECTORY & SECTION BREAKDOWN', left, doc.y, { lineBreak: true })
    doc.y += 3

    const sBoxY = doc.y
    doc.roundedRect(left, sBoxY, width, boxH, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)

    const half = Math.ceil(sections.length / 2)
    const colW = (width - 24) / 2

    for (let i = 0; i < sections.length; i++) {
      const isRight = i >= half
      const rowIdx = isRight ? i - half : i
      const colX = isRight ? left + width / 2 + 6 : left + 8
      const itemY = sBoxY + 6 + rowIdx * rowH

      doc.font('Helvetica').fontSize(7).fillColor(PALETTE.textSecondary)
      doc.text(cleanText(sections[i].path), colX, itemY, { width: colW - 55, lineBreak: false })
      doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
      doc.text(`${sections[i].pageCount} pages`, colX, itemY, {
        width: colW,
        align: 'right',
        lineBreak: false,
      })
    }

    doc.y = sBoxY + boxH + 10
  }

  // 4. Top Internally Linked URLs
  const topLinks = (architecture.topLinkedUrls || []).slice(0, 8)
  if (topLinks.length > 0) {
    const rowH = 14
    const boxH = topLinks.length * rowH + 10
    ensureSpace(doc, boxH + 18)

    doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
    doc.text('TOP INTERNALLY LINKED PAGES', left, doc.y, { lineBreak: true })
    doc.y += 3

    const tBoxY = doc.y
    doc.roundedRect(left, tBoxY, width, boxH, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)

    topLinks.forEach((item, idx) => {
      const itemY = tBoxY + 6 + idx * rowH
      doc.font('Helvetica').fontSize(7).fillColor(PALETTE.textSecondary)
      doc.text(`${idx + 1}. ${cleanText(item.url)}`, left + 8, itemY, {
        width: width - 85,
        lineBreak: false,
      })
      doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.brand)
      doc.text(`${item.inboundCount} links`, left + 8, itemY, {
        width: width - 16,
        align: 'right',
        lineBreak: false,
      })
    })

    doc.y = tBoxY + boxH + 10
  }

  // 5. Orphan Candidates
  const orphans = architecture.orphanCandidates || []
  ensureSpace(doc, 40)
  doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
  doc.text(`ORPHAN PAGE CANDIDATES (${orphans.length})`, left, doc.y, { lineBreak: true })
  doc.y += 3

  if (orphans.length === 0) {
    const boxH = 22
    doc.roundedRect(left, doc.y, width, boxH, 4).fillAndStroke('#F0FDF4', '#BBF7D0')
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#166534')
      .text(
        'No orphan candidates identified. All discovered sitemap URLs are reachable via internal links.',
        left + 10,
        doc.y + 7,
        {
          width: width - 20,
          lineBreak: false,
        }
      )
    doc.y += boxH + 12
  } else {
    const displayOrphans = orphans.slice(0, 6)
    const boxH = displayOrphans.length * 13 + 18
    doc.roundedRect(left, doc.y, width, boxH, 4).fillAndStroke('#FEF2F2', '#FECACA')
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#991B1B')
    doc.text('Sitemap URLs with 0 inbound internal links identified:', left + 8, doc.y + 6, {
      width: width - 16,
      lineBreak: false,
    })
    displayOrphans.forEach((u, i) => {
      doc.font('Helvetica').fontSize(6.5).fillColor('#7F1D1D')
      doc.text(`• ${cleanText(u)}`, left + 12, doc.y + 16 + i * 13, {
        width: width - 24,
        lineBreak: false,
      })
    })
    if (orphans.length > displayOrphans.length) {
      doc.font('Helvetica-Oblique').fontSize(6).fillColor('#991B1B')
      doc.text(
        `+ ${orphans.length - displayOrphans.length} more orphan candidate URLs`,
        left + 12,
        doc.y + 16 + displayOrphans.length * 13,
        {
          width: width - 24,
          lineBreak: false,
        }
      )
    }
    doc.y += boxH + 12
  }
}

function drawDuplicates(doc: PDFKit.PDFDocument, duplicates: DuplicateCandidateSummary) {
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right

  ensureSpace(doc, 45)
  doc.font('Helvetica-Bold').fontSize(8).fillColor(PALETTE.textMuted)
  doc.text('DUPLICATE & CANONICAL CONFLICT ANALYSIS', left, doc.y, { lineBreak: true })
  doc.y += 5

  // 1. Duplicate Title Groups
  const titleGroups = duplicates.titleDuplicateGroups || []
  ensureSpace(doc, 35)
  doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
  doc.text(`DUPLICATE TITLE GROUPS (${titleGroups.length})`, left, doc.y, { lineBreak: true })
  doc.y += 3

  if (titleGroups.length === 0) {
    const boxH = 22
    doc.roundedRect(left, doc.y, width, boxH, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(PALETTE.textMuted)
      .text(
        'No duplicate title groups identified. All crawled pages have unique title tags.',
        left + 10,
        doc.y + 7,
        {
          width: width - 20,
          lineBreak: false,
        }
      )
    doc.y += boxH + 8
  } else {
    titleGroups.slice(0, 4).forEach((group) => {
      const urls = (group.urls || []).slice(0, 3)
      const cardH = 20 + urls.length * 12
      ensureSpace(doc, cardH + 5)
      const cY = doc.y
      doc.roundedRect(left, cY, width, cardH, 4).fillAndStroke('#FFFFFF', PALETTE.border)
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PALETTE.textPrimary)
      doc.text(`"${cleanText(group.title)}" (${group.urls.length} pages)`, left + 8, cY + 5, {
        width: width - 16,
        lineBreak: false,
      })
      urls.forEach((u, i) => {
        doc.font('Helvetica').fontSize(6.5).fillColor(PALETTE.textSecondary)
        doc.text(`• ${cleanText(u)}`, left + 12, cY + 18 + i * 12, {
          width: width - 24,
          lineBreak: false,
        })
      })
      doc.y = cY + cardH + 6
    })
    doc.y += 4
  }

  // 2. Duplicate Meta-Description Groups
  const descGroups = duplicates.descriptionDuplicateGroups || []
  ensureSpace(doc, 35)
  doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
  doc.text(`DUPLICATE META-DESCRIPTION GROUPS (${descGroups.length})`, left, doc.y, {
    lineBreak: true,
  })
  doc.y += 3

  if (descGroups.length === 0) {
    const boxH = 22
    doc.roundedRect(left, doc.y, width, boxH, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(PALETTE.textMuted)
      .text(
        'No duplicate meta-description groups identified. All crawled pages have unique descriptions.',
        left + 10,
        doc.y + 7,
        {
          width: width - 20,
          lineBreak: false,
        }
      )
    doc.y += boxH + 8
  } else {
    descGroups.slice(0, 4).forEach((group) => {
      const urls = (group.urls || []).slice(0, 3)
      const cardH = 20 + urls.length * 12
      ensureSpace(doc, cardH + 5)
      const cY = doc.y
      doc.roundedRect(left, cY, width, cardH, 4).fillAndStroke('#FFFFFF', PALETTE.border)
      doc.font('Helvetica-Oblique').fontSize(7).fillColor(PALETTE.textPrimary)
      const descSnippet =
        group.description.length > 90 ? group.description.slice(0, 87) + '...' : group.description
      doc.text(`"${cleanText(descSnippet)}" (${group.urls.length} pages)`, left + 8, cY + 5, {
        width: width - 16,
        lineBreak: false,
      })
      urls.forEach((u, i) => {
        doc.font('Helvetica').fontSize(6.5).fillColor(PALETTE.textSecondary)
        doc.text(`• ${cleanText(u)}`, left + 12, cY + 18 + i * 12, {
          width: width - 24,
          lineBreak: false,
        })
      })
      doc.y = cY + cardH + 6
    })
    doc.y += 4
  }

  // 3. Parameter Variation Groups
  const paramGroups = duplicates.parameterVariationGroups || []
  ensureSpace(doc, 35)
  doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
  doc.text(`URL PARAMETER VARIATIONS (${paramGroups.length})`, left, doc.y, { lineBreak: true })
  doc.y += 3

  if (paramGroups.length === 0) {
    const boxH = 22
    doc.roundedRect(left, doc.y, width, boxH, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(PALETTE.textMuted)
      .text(
        'No parameter variation groups identified. No query parameter duplicate variations detected.',
        left + 10,
        doc.y + 7,
        {
          width: width - 20,
          lineBreak: false,
        }
      )
    doc.y += boxH + 8
  } else {
    paramGroups.slice(0, 4).forEach((group) => {
      const vars = (group.variations || []).slice(0, 3)
      const cardH = 20 + vars.length * 12
      ensureSpace(doc, cardH + 5)
      const cY = doc.y
      doc.roundedRect(left, cY, width, cardH, 4).fillAndStroke('#FFFFFF', PALETTE.border)
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PALETTE.textPrimary)
      doc.text(
        `Base: ${cleanText(group.baseUrl)} (${group.variations.length} variations)`,
        left + 8,
        cY + 5,
        {
          width: width - 16,
          lineBreak: false,
        }
      )
      vars.forEach((v, i) => {
        doc.font('Helvetica').fontSize(6.5).fillColor(PALETTE.textSecondary)
        doc.text(`• ${cleanText(v)}`, left + 12, cY + 18 + i * 12, {
          width: width - 24,
          lineBreak: false,
        })
      })
      doc.y = cY + cardH + 6
    })
    doc.y += 4
  }

  // 4. Canonical Conflict Groups
  const canonGroups = duplicates.canonicalConflictGroups || []
  ensureSpace(doc, 35)
  doc.font('Helvetica-Bold').fontSize(7).fillColor(PALETTE.textPrimary)
  doc.text(`CANONICAL CONFLICT GROUPS (${canonGroups.length})`, left, doc.y, { lineBreak: true })
  doc.y += 3

  if (canonGroups.length === 0) {
    const boxH = 22
    doc.roundedRect(left, doc.y, width, boxH, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(PALETTE.textMuted)
      .text(
        'No canonical conflict groups identified. Canonical declarations point to consistent targets.',
        left + 10,
        doc.y + 7,
        {
          width: width - 20,
          lineBreak: false,
        }
      )
    doc.y += boxH + 12
  } else {
    canonGroups.slice(0, 4).forEach((group) => {
      const urls = (group.declaredOnUrls || []).slice(0, 3)
      const cardH = 20 + urls.length * 12
      ensureSpace(doc, cardH + 5)
      const cY = doc.y
      doc.roundedRect(left, cY, width, cardH, 4).fillAndStroke('#FFFFFF', PALETTE.border)
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PALETTE.textPrimary)
      doc.text(
        `Target: ${cleanText(group.canonicalUrl)} (${group.declaredOnUrls.length} pages)`,
        left + 8,
        cY + 5,
        {
          width: width - 16,
          lineBreak: false,
        }
      )
      urls.forEach((u, i) => {
        doc.font('Helvetica').fontSize(6.5).fillColor(PALETTE.textSecondary)
        doc.text(`• Declared on: ${cleanText(u)}`, left + 12, cY + 18 + i * 12, {
          width: width - 24,
          lineBreak: false,
        })
      })
      doc.y = cY + cardH + 6
    })
    doc.y += 8
  }
}

export async function buildPdf(input: {
  scan: ScanRecord
  result: CrawlResult
  problemLabel: string
  generatedAt: string
}): Promise<Buffer> {
  const { scan, result, problemLabel, generatedAt } = input

  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 36,
      bottom: 40,
      left: 40,
      right: 40,
    },
    bufferPages: true,
    info: {
      Title: 'Locitra Technical SEO Report',
      Author: 'Locitra',
      Subject: 'Technical SEO audit report',
      Keywords: 'SEO, technical SEO, Locitra, website audit',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  // 1. Premium Header
  drawHeader(doc, scan, problemLabel, generatedAt)

  // 2. Executive Summary Severity Cards
  drawSummaryCards(doc, result.summary)

  // 3. Scan Coverage 2-column metrics
  drawCoverage(doc, scan, result)

  // 4. Site Architecture & Structure (Full Plan)
  if (result.architecture) {
    drawArchitecture(doc, result.architecture)
  }

  // 5. Duplicate & Canonical Conflict Analysis (Full Plan)
  if (result.duplicates) {
    drawDuplicates(doc, result.duplicates)
  }

  // 6. Findings Section
  const left = doc.page.margins.left
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  ensureSpace(doc, 30)
  doc.font('Helvetica-Bold').fontSize(8).fillColor(PALETTE.textMuted)
  doc.text(`FINDINGS (${result.findings.length})`, left, doc.y, { lineBreak: true })
  doc.y += 5

  if (result.findings.length === 0) {
    doc.roundedRect(left, doc.y, width, 36, 4).fillAndStroke(PALETTE.surfaceBg, PALETTE.border)
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(PALETTE.textMuted)
      .text(
        'No findings were recorded for this scan. All monitored checks passed.',
        left + 12,
        doc.y + 13,
        {
          width: width - 24,
        }
      )
    doc.y += 36
  } else {
    result.findings.forEach((finding, index) => {
      drawFinding(doc, finding, index + 1)
    })
  }

  // Prepared by disclaimer
  ensureSpace(doc, 25)
  doc.moveDown(0.4)
  doc.font('Helvetica').fontSize(7).fillColor(PALETTE.textLight)
  doc.text(
    'Prepared by Locitra Technical SEO. This report is based on scan evidence captured at the time of analysis.',
    left,
    doc.y,
    { align: 'center', width }
  )

  // 7. Global Footers across all pages
  drawFooters(doc)

  doc.end()

  return new Promise<Buffer>((resolve, reject) => {
    doc.once('end', () => resolve(Buffer.concat(chunks)))
    doc.once('error', reject)
  })
}

export async function GET(request: Request, context: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await context.params

  if (!isUuid(scanId)) {
    return NextResponse.json({ error: 'Invalid scan ID.' }, { status: 400 })
  }

  try {
    const scan = await getScanRecord(scanId)

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found.' }, { status: 404 })
    }

    if (scan.status !== 'complete' || !scan.report_json) {
      return NextResponse.json({ error: 'The scan report is not ready yet.' }, { status: 409 })
    }

    if (scan.plan === 'free' || scan.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'PDF downloads are available for paid reports only.' },
        { status: 403 }
      )
    }

    const requestUrl = new URL(request.url)
    const accessToken = requestUrl.searchParams.get('key')

    if (
      scan.access_mode === 'private' &&
      !verifyReportAccessToken(accessToken, scan.report_token_hash)
    ) {
      return NextResponse.json(
        { error: 'This PDF requires a valid report access link.' },
        { status: 403 }
      )
    }

    const result = scan.report_json as CrawlResult
    const problem = scan.problem as DiagnosticProblem
    const generatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const pdf = await buildPdf({
      scan,
      result,
      problemLabel: PROBLEM_LABELS[problem] ?? problem,
      generatedAt,
    })

    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="locitra-technical-seo-${scan.id}.pdf"`,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Failed to generate Technical SEO PDF:', error)
    return NextResponse.json({ error: 'Unable to generate the PDF report.' }, { status: 500 })
  }
}
