import { PDFDocument } from 'pdfkit'
import { NextResponse } from 'next/server'
import {
  getScanRecord,
  verifyReportAccessToken,
} from '@/lib/technical-seo/scan-repository'
import type { CrawlResult, DiagnosticProblem, Finding } from '@/lib/technical-seo/types'

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
  unknown: "I don't know - find the important problems",
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function cleanText(value: string) {
  return value
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/•/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
}

function escapePdfText(value: string) {
  return cleanText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapText(value: string, maxChars: number) {
  const words = cleanText(value).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if (!current) {
      current = word.slice(0, maxChars)
      continue
    }

    if ((current + ' ' + word).length <= maxChars) {
      current += ' ' + word
    } else {
      lines.push(current)
      current = word.slice(0, maxChars)
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function buildPdf(lines: string[]) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
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
  const title = lines[0] ?? 'LOCITRA TECHNICAL SEO REPORT'
  const bodyLines = lines.slice(1)

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#111827').text(title)
  doc.moveDown(0.35)
  doc.moveTo(48, doc.y).lineTo(547, doc.y).lineWidth(1).strokeColor('#D1D5DB').stroke()
  doc.moveDown(0.8)

  for (const line of bodyLines) {
    if (line === 'SUMMARY' || line === 'SCAN COVERAGE' || line === 'FINDINGS') {
      doc.moveDown(0.45)
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text(line)
      doc.moveDown(0.25)
      doc.moveTo(48, doc.y).lineTo(547, doc.y).lineWidth(0.6).strokeColor('#D1D5DB').stroke()
      doc.moveDown(0.35)
      continue
    }
    if (line === '-------' || line === '-------------' || line === '--------' || line === '==============================================') continue
    if (line === '') { doc.moveDown(0.35); continue }
    if (/^\\d+\\. \\[(CRITICAL|HIGH|MEDIUM|LOW|INFO)\\]/i.test(line)) {
      doc.moveDown(0.35)
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(line, { width: 499 })
      continue
    }
    if (line.startsWith('   Category:')) {
      doc.font('Helvetica').fontSize(8.5).fillColor('#4B5563').text(line.trim(), { width: 499 })
      continue
    }
    if (line.startsWith('   Evidence:')) {
      doc.moveDown(0.15)
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151').text(line.trim())
      continue
    }
    if (line.startsWith('   Summary:') || line.startsWith('   Recommended action:')) {
      const separatorIndex = line.indexOf(': ')
      const label = separatorIndex >= 0 ? line.slice(0, separatorIndex + 2).trim() : ''
      const value = separatorIndex >= 0 ? line.slice(separatorIndex + 2) : line
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151').text(label, { continued: true })
      doc.font('Helvetica').text(value, { width: 499 })
      continue
    }
    if (line.startsWith('     - ')) {
      doc.font('Helvetica').fontSize(8.5).fillColor('#4B5563').text('• ' + line.slice(6), { width: 480, indent: 8 })
      continue
    }
    if (line.startsWith('----------------------------------------------')) {
      doc.moveDown(0.5)
      doc.moveTo(48, doc.y).lineTo(547, doc.y).lineWidth(0.6).strokeColor('#D1D5DB').stroke()
      doc.moveDown(0.5)
      continue
    }
    if (line.startsWith('Prepared by Locitra')) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151').text(line)
      continue
    }
    if (line.startsWith('This report is based')) {
      doc.font('Helvetica').fontSize(7.5).fillColor('#6B7280').text(line, { width: 499 })
      continue
    }
    doc.font('Helvetica').fontSize(9).fillColor('#374151').text(line, { width: 499, lineGap: 2 })
  }

  const range = doc.bufferedPageRange()
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index)
    doc.font('Helvetica').fontSize(7).fillColor('#9CA3AF')
    doc.text('Locitra Technical SEO Report  |  Page ' + (index + 1) + ' of ' + range.count, 48, 805, { width: 499, align: 'center' })
  }

  doc.end()
  return new Promise<Buffer>((resolve, reject) => {
    doc.once('end', () => resolve(Buffer.concat(chunks)))
    doc.once('error', reject)
  })
}

function addWrapped(lines: string[], label: string, value: string, indent = 0) {
  const prefix = ' '.repeat(indent)
  const firstPrefix = prefix + label
  const continuationPrefix = prefix + ' '.repeat(label.length)

  const wrapped = wrapText(value, Math.max(20, 92 - firstPrefix.length))
  lines.push(firstPrefix + wrapped[0])

  for (const line of wrapped.slice(1)) {
    lines.push(continuationPrefix + line)
  }
}

function addFinding(lines: string[], finding: Finding, index: number) {
  lines.push('')
  lines.push(`${index}. [${finding.severity.toUpperCase()}] ${finding.title}`)
  lines.push(`   Category: ${finding.category} | Confidence: ${finding.confidence}`)
  addWrapped(lines, '   Summary: ', finding.summary)

  if (finding.evidence.length) {
    lines.push('   Evidence:')
    for (const evidence of finding.evidence) {
      for (const line of wrapText('- ' + evidence, 88)) {
        lines.push('     ' + line)
      }
    }
  }

  addWrapped(lines, '   Recommended action: ', finding.recommendation)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ scanId: string }> }
) {
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
      return NextResponse.json(
        { error: 'The scan report is not ready yet.' },
        { status: 409 }
      )
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

    const lines: string[] = [
      'LOCITRA TECHNICAL SEO REPORT',
      '==============================================',
      '',
      `Website: ${scan.website_url}`,
      `Report ID: ${scan.id}`,
      `Plan: ${scan.plan}`,
      `Diagnostic focus: ${PROBLEM_LABELS[problem] ?? problem}`,
      `Generated: ${generatedAt} UTC`,
      '',
      'SUMMARY',
      '-------',
      `Critical: ${result.summary.critical}`,
      `High:     ${result.summary.high}`,
      `Medium:   ${result.summary.medium}`,
      `Low:      ${result.summary.low}`,
      `Info:     ${result.summary.info}`,
      '',
      'SCAN COVERAGE',
      '-------------',
      `Pages checked:      ${result.pagesChecked}`,
      `URLs discovered:    ${result.urlsDiscovered}`,
      `Pages not crawled:  ${result.urlsNotCrawled}`,
      `Crawl errors:       ${result.crawlErrors}`,
      `Robots blocked:     ${result.urlsBlockedByRobots}`,
      `Internal links:     ${result.metrics.internalLinks}`,
      `External links:     ${result.metrics.externalLinks}`,
      `Images:             ${result.metrics.images}`,
      `Images without alt: ${result.metrics.imagesWithoutAlt}`,
      `JSON-LD blocks:     ${result.metrics.jsonLdBlocks}`,
      `robots.txt:         ${result.robotsTxt.found ? 'Found' : 'Not found'}`,
      `Sitemap:            ${result.sitemap.found ? 'Found' : 'Not found'}`,
      '',
      'FINDINGS',
      '--------',
    ]

    if (result.findings.length === 0) {
      lines.push('No findings were recorded for this scan.')
    } else {
      result.findings.forEach((finding, index) => addFinding(lines, finding, index + 1))
    }

    lines.push('')
    lines.push('----------------------------------------------')
    lines.push('Prepared by Locitra Technical SEO.')
    lines.push('This report is based on the scan evidence available at the time of analysis.')

    const pdf = buildPdf(lines)

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
    return NextResponse.json(
      { error: 'Unable to generate the PDF report.' },
      { status: 500 }
    )
  }
}
