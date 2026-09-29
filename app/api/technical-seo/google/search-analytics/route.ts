import { NextResponse } from 'next/server'
import {
  executeSearchAnalyticsDiagnostics,
  SearchAnalyticsError,
  type SearchAnalyticsDependencies,
} from '@/lib/technical-seo/search-analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export interface GoogleSearchAnalyticsPostDependencies extends SearchAnalyticsDependencies {
  executeSearchAnalyticsDiagnostics?: typeof executeSearchAnalyticsDiagnostics
}

export async function handleGoogleSearchAnalyticsPost(
  request: Request,
  deps: GoogleSearchAnalyticsPostDependencies = {}
) {
  const executeFn = deps.executeSearchAnalyticsDiagnostics ?? executeSearchAnalyticsDiagnostics

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Request body must be an object.' }, { status: 400 })
    }

    const { scanId, key } = body as Record<string, unknown>

    if (typeof scanId !== 'string' || !isUuid(scanId)) {
      return NextResponse.json({ error: 'Invalid or missing scan ID.' }, { status: 400 })
    }

    if (typeof key !== 'string' || !key.trim()) {
      return NextResponse.json({ error: 'Access key is required.' }, { status: 400 })
    }

    const diagnostics = await executeFn(
      {
        scanId,
        key: key.trim(),
      },
      deps
    )

    return NextResponse.json({
      success: true,
      diagnostics,
    })
  } catch (error) {
    if (error instanceof SearchAnalyticsError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    const message =
      error instanceof Error ? error.message : 'Failed to execute Search Analytics diagnostics.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handleGoogleSearchAnalyticsPost(request)
}
