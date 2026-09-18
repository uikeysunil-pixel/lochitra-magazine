import { NextResponse } from 'next/server'
import { runCrawl } from '@/lib/technical-seo/crawler'
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

    if (plan !== 'free') {
      return NextResponse.json(
        {
          error:
            'Paid scans are not enabled yet. The crawler is being validated first; billing and paid crawl limits will be enabled after the MVP passes real-site testing.',
        },
        { status: 402 }
      )
    }

    const result = await runCrawl(url, plan as PlanId, problem as DiagnosticProblem)
    const matchedFindings = result.findings.length

    return NextResponse.json({
      ...result,
      requestedProblem: problem,
      requestedPlan: plan,
      diagnosticFocus: {
        id: problem,
        label: PROBLEM_LABELS[problem as DiagnosticProblem],
        matchedFindings,
      },
      productStage: 'mvp-free-crawl',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze the website.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
