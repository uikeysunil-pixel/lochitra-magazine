import { NextResponse } from 'next/server'
import { runQuickScan } from '@/lib/technical-seo/scanner'
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


export async function POST(request: Request) {
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

    // Phase 1 intentionally exposes only the free quick scan.
    // Paid plan enforcement will be added with billing before paid scans are enabled.
    const result = await runQuickScan(url)
    const matched = result.findings.filter((finding) =>
      finding.diagnosticProblems.includes(problem as DiagnosticProblem)
    )
    const problemIndex = new Map(
      matched.map((finding, index) => [finding.id, index])
    )

    const focusedFindings = [...result.findings].sort((a, b) => {
      const aMatched = problemIndex.has(a.id)
      const bMatched = problemIndex.has(b.id)
      if (aMatched !== bMatched) return aMatched ? -1 : 1

      const severityRank: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        info: 4,
      }

      return (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99)
    })

    return NextResponse.json({
      ...result,
      requestedProblem: problem,
      requestedPlan: plan,
      diagnosticFocus: {
        id: problem,
        label: PROBLEM_LABELS[problem as DiagnosticProblem],
        matchedFindings: matched.length,
      },
      findings: focusedFindings,
      productStage: 'mvp-free-scan',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze the website.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
