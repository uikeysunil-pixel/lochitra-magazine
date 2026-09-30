import { NextResponse } from 'next/server'
import { getScanRecord } from '@/lib/technical-seo/scan-repository'
import {
  encryptToken,
  exchangeCodeForTokens,
  hashOAuthState,
  saveGoogleSearchConsoleConnection,
  verifyAndConsumeScanOAuthState,
  verifyOAuthState,
  type OAuthStatePayload,
} from '@/lib/technical-seo/google-search-console'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface GoogleCallbackDependencies {
  verifyOAuthState?: typeof verifyOAuthState
  hashOAuthState?: typeof hashOAuthState
  verifyAndConsumeScanOAuthState?: typeof verifyAndConsumeScanOAuthState
  getScanRecord?: typeof getScanRecord
  exchangeCodeForTokens?: typeof exchangeCodeForTokens
  encryptToken?: typeof encryptToken
  saveGoogleSearchConsoleConnection?: typeof saveGoogleSearchConsoleConnection
}

export async function handleGoogleCallback(
  request: Request,
  deps: GoogleCallbackDependencies = {}
) {
  const verifyOAuthStateFn = deps.verifyOAuthState ?? verifyOAuthState
  const hashOAuthStateFn = deps.hashOAuthState ?? hashOAuthState
  const verifyAndConsumeScanOAuthStateFn =
    deps.verifyAndConsumeScanOAuthState ?? verifyAndConsumeScanOAuthState
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const exchangeCodeForTokensFn = deps.exchangeCodeForTokens ?? exchangeCodeForTokens
  const encryptTokenFn = deps.encryptToken ?? encryptToken
  const saveGoogleSearchConsoleConnectionFn =
    deps.saveGoogleSearchConsoleConnection ?? saveGoogleSearchConsoleConnection

  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const googleError = url.searchParams.get('error')

    // Handle Google OAuth error responses (e.g. access_denied)
    if (googleError) {
      if (state) {
        let payload: OAuthStatePayload | null = null
        try {
          payload = verifyOAuthStateFn(state)
        } catch {
          // If state is invalid or tampered, fall through to JSON error
        }

        if (payload) {
          const stateHash = hashOAuthStateFn(state)
          const stateValid = await verifyAndConsumeScanOAuthStateFn(payload.scanId, stateHash)
          if (!stateValid) {
            return NextResponse.json(
              { error: 'OAuth state has already been used or is invalid.' },
              { status: 400 }
            )
          }

          const params = new URLSearchParams()
          if (payload.accessKey) {
            params.set('key', payload.accessKey)
          }
          params.set('gsc_error', googleError)
          const redirectUrl = new URL(
            `/technical-seo/scan/${payload.scanId}/?${params.toString()}`,
            request.url
          )
          return NextResponse.redirect(redirectUrl)
        }
      }
      return NextResponse.json(
        { error: `Google authorization error: ${googleError}` },
        { status: 400 }
      )
    }

    if (!state) {
      return NextResponse.json({ error: 'Missing OAuth state parameter.' }, { status: 400 })
    }

    let statePayload: OAuthStatePayload
    try {
      statePayload = verifyOAuthStateFn(state)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired OAuth state.' }, { status: 400 })
    }

    // Protect against state replay attacks using atomic database consumption
    const stateHash = hashOAuthStateFn(state)
    const stateValid = await verifyAndConsumeScanOAuthStateFn(statePayload.scanId, stateHash)
    if (!stateValid) {
      return NextResponse.json(
        { error: 'OAuth state has already been used or is invalid.' },
        { status: 400 }
      )
    }

    // Defense-in-depth: retrieve scan and verify plan authorization
    const scan = await getScanRecordFn(statePayload.scanId)
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found.' }, { status: 404 })
    }

    if (scan.plan !== 'deep') {
      return NextResponse.json(
        {
          error: 'Google Search Console connection is only available for Deep Investigation scans.',
        },
        { status: 400 }
      )
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code from Google.' },
        { status: 400 }
      )
    }

    let tokens: {
      accessToken?: string
      refreshToken: string
      expiryDate?: number | null
      scope?: string
    }
    try {
      tokens = await exchangeCodeForTokensFn(code)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token exchange failed'
      return NextResponse.json(
        { error: `Failed to exchange authorization code: ${message}` },
        { status: 400 }
      )
    }

    if (!tokens.refreshToken) {
      return NextResponse.json(
        {
          error:
            'No refresh token received from Google. Durable offline access is required for Deep scans.',
        },
        { status: 400 }
      )
    }

    // Encrypt refresh token using server-side AES-256-GCM
    const encryptedRefreshToken = encryptTokenFn(tokens.refreshToken)

    // Store encrypted token and metadata on scan record.
    // Phase 10B/10C: Do not auto-select or infer a Search Console property during OAuth callback.
    // Keep gsc_property = null unless an explicit property is already supplied by an existing trusted flow.
    await saveGoogleSearchConsoleConnectionFn({
      scanId: statePayload.scanId,
      encryptedRefreshToken,
      tokenExpiresAt: tokens.expiryDate ? new Date(tokens.expiryDate).toISOString() : null,
    })

    // Redirect back to scan/status flow without placing tokens or secrets in the URL
    const params = new URLSearchParams()
    if (statePayload.accessKey) {
      params.set('key', statePayload.accessKey)
    }
    params.set('gsc', 'connected')

    const destination = new URL(
      `/technical-seo/scan/${statePayload.scanId}/?${params.toString()}`,
      request.url
    )

    return NextResponse.redirect(destination)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google OAuth callback failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handleGoogleCallback(request)
}
