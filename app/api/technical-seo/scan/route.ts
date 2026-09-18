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

    return NextResponse.json({
      ...result,
      requestedProblem: problem,
      requestedPlan: plan,
      productStage: 'mvp-free-scan',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze the website.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
