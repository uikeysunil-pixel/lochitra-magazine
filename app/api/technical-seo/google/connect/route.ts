import { NextResponse } from 'next/server'
import { getScanRecord, verifyReportAccessToken } from '@/lib/technical-seo/scan-repository'
import {
  createOAuthAuthorizationUrl,
  createOAuthState,
  hashOAuthState,
  saveScanOAuthStateHash,
} from '@/lib/technical-seo/google-search-console'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export interface GoogleConnectDependencies {
  getScanRecord?: typeof getScanRecord
  verifyReportAccessToken?: typeof verifyReportAccessToken
  saveScanOAuthStateHash?: typeof saveScanOAuthStateHash
  createOAuthState?: typeof createOAuthState
  createOAuthAuthorizationUrl?: typeof createOAuthAuthorizationUrl
  hashOAuthState?: typeof hashOAuthState
}

export async function handleGoogleConnect(request: Request, deps: GoogleConnectDependencies = {}) {
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const verifyReportAccessTokenFn = deps.verifyReportAccessToken ?? verifyReportAccessToken
  const saveScanOAuthStateHashFn = deps.saveScanOAuthStateHash ?? saveScanOAuthStateHash
  const createOAuthStateFn = deps.createOAuthState ?? createOAuthState
  const createOAuthAuthorizationUrlFn =
    deps.createOAuthAuthorizationUrl ?? createOAuthAuthorizationUrl
  const hashOAuthStateFn = deps.hashOAuthState ?? hashOAuthState

  try {
    const url = new URL(request.url)
    const scanId = url.searchParams.get('scanId')
    const key = url.searchParams.get('key')

    if (!scanId || !isUuid(scanId)) {
      return NextResponse.json({ error: 'Invalid scan ID.' }, { status: 400 })
    }

    if (!key) {
      return NextResponse.json({ error: 'Access key is required.' }, { status: 400 })
    }

    const scan = await getScanRecordFn(scanId)
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found.' }, { status: 404 })
    }

    const hasValidKey = verifyReportAccessTokenFn(key, scan.report_token_hash)
    if (!hasValidKey) {
      return NextResponse.json({ error: 'Invalid access key.' }, { status: 403 })
    }

    if (scan.plan !== 'deep') {
      return NextResponse.json(
        {
          error: 'Google Search Console connection is only available for Deep Investigation scans.',
        },
        { status: 400 }
      )
    }

    const state = createOAuthStateFn({ scanId, accessKey: key })
    const stateHash = hashOAuthStateFn(state)

    await saveScanOAuthStateHashFn(scanId, stateHash)

    const authorizationUrl = createOAuthAuthorizationUrlFn({ state })

    return NextResponse.redirect(authorizationUrl)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to initialize Google connection.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handleGoogleConnect(request)
}
