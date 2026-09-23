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
  const pageWidth = 595
  const pageHeight = 842
  const margin = 48
  const lineHeight = 13
  const maxLinesPerPage = 56

  const pages: string[][] = []
  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage))
  }

  if (pages.length === 0) pages.push([])

  const objects: string[] = []
  const pageObjectNumbers: number[] = []

  const addObject = (body: string) => {
    objects.push(body)
    return objects.length
  }

  const fontObject = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const pagesObject = addObject('<< /Type /Pages /Kids [] /Count 0 >>')
  const catalogObject = addObject(
    '<< /Type /Catalog /Pages ' + pagesObject + ' 0 R >>'
  )

  for (const pageLines of pages) {
    const commands: string[] = [
      'BT',
      '/F1 9 Tf',
      `${margin} ${pageHeight - margin} Td`,
    ]

    pageLines.forEach((line, index) => {
      if (index > 0) commands.push(`0 -${lineHeight} Td`)
      commands.push(`(${escapePdfText(line)}) Tj`)
    })

    commands.push('ET')

    const stream = commands.join('\n')
    const contentObject = addObject(
      `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`
    )

    const pageObject = addObject(
      `<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`
    )

    pageObjectNumbers.push(pageObject)
  }

  const kids = pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')
  objects[pagesObject - 1] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, 'latin1')
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'latin1')
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
