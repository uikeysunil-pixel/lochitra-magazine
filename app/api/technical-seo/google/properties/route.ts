import { NextResponse } from 'next/server'
import { getScanRecord, verifyReportAccessToken } from '@/lib/technical-seo/scan-repository'
import {
  ALLOWED_SEARCH_CONSOLE_PERMISSIONS,
  decryptToken,
  getGoogleSearchConsoleConnection,
  isSearchConsolePropertyMatch,
  listSearchConsoleProperties,
  saveScanSearchConsoleProperty,
  type AnnotatedGscProperty,
} from '@/lib/technical-seo/google-search-console'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export interface GooglePropertiesGetDependencies {
  getScanRecord?: typeof getScanRecord
  verifyReportAccessToken?: typeof verifyReportAccessToken
  getGoogleSearchConsoleConnection?: typeof getGoogleSearchConsoleConnection
  decryptToken?: typeof decryptToken
  listSearchConsoleProperties?: typeof listSearchConsoleProperties
  isSearchConsolePropertyMatch?: typeof isSearchConsolePropertyMatch
}

export async function handleGooglePropertiesGet(
  request: Request,
  deps: GooglePropertiesGetDependencies = {}
) {
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const verifyReportAccessTokenFn = deps.verifyReportAccessToken ?? verifyReportAccessToken
  const getGoogleConnectionFn =
    deps.getGoogleSearchConsoleConnection ?? getGoogleSearchConsoleConnection
  const decryptTokenFn = deps.decryptToken ?? decryptToken
  const listPropertiesFn = deps.listSearchConsoleProperties ?? listSearchConsoleProperties
  const isPropertyMatchFn = deps.isSearchConsolePropertyMatch ?? isSearchConsolePropertyMatch

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
          error:
            'Google Search Console properties are only available for Deep Investigation scans.',
        },
        { status: 400 }
      )
    }

    const connection = await getGoogleConnectionFn(scanId)
    if (!connection?.encryptedRefreshToken) {
      return NextResponse.json(
        {
          error: 'Google account is not connected for this scan.',
        },
        { status: 400 }
      )
    }

    let plainRefreshToken: string
    try {
      plainRefreshToken = decryptTokenFn(connection.encryptedRefreshToken)
    } catch {
      return NextResponse.json(
        { error: 'Failed to access stored Google credentials. Please reconnect.' },
        { status: 500 }
      )
    }

    let rawProperties
    try {
      rawProperties = await listPropertiesFn(plainRefreshToken)
    } catch (apiError) {
      const message =
        apiError instanceof Error
          ? apiError.message
          : 'Failed to retrieve Search Console properties.'
      return NextResponse.json(
        { error: `Google Search Console API error: ${message}` },
        { status: 502 }
      )
    }

    const targetUrl = scan.final_url ?? scan.website_url

    const annotated: AnnotatedGscProperty[] = rawProperties.map((entry) => {
      const isDomain = entry.siteUrl.toLowerCase().startsWith('sc-domain:')
      const isMatch = isPropertyMatchFn(entry.siteUrl, targetUrl)
      const isPermissionAllowed = Boolean(
        entry.permissionLevel && ALLOWED_SEARCH_CONSOLE_PERMISSIONS.has(entry.permissionLevel)
      )

      return {
        siteUrl: entry.siteUrl,
        permissionLevel: entry.permissionLevel,
        propertyType: isDomain ? 'domain' : 'url_prefix',
        isMatch,
        isSelectable: isMatch && isPermissionAllowed,
      }
    })

    // Sort selectable matching properties first, preserving order within groups
    annotated.sort((a, b) => {
      if (a.isSelectable && !b.isSelectable) return -1
      if (!a.isSelectable && b.isSelectable) return 1
      if (a.isMatch && !b.isMatch) return -1
      if (!a.isMatch && b.isMatch) return 1
      return a.siteUrl.localeCompare(b.siteUrl)
    })

    return NextResponse.json({
      targetUrl,
      currentProperty: connection.property ?? null,
      properties: annotated,
      hasMatchingProperty: annotated.some((p) => p.isSelectable),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve Search Console properties.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export interface GooglePropertiesPostDependencies {
  getScanRecord?: typeof getScanRecord
  verifyReportAccessToken?: typeof verifyReportAccessToken
  getGoogleSearchConsoleConnection?: typeof getGoogleSearchConsoleConnection
  decryptToken?: typeof decryptToken
  listSearchConsoleProperties?: typeof listSearchConsoleProperties
  isSearchConsolePropertyMatch?: typeof isSearchConsolePropertyMatch
  saveScanSearchConsoleProperty?: typeof saveScanSearchConsoleProperty
}

export async function handleGooglePropertiesPost(
  request: Request,
  deps: GooglePropertiesPostDependencies = {}
) {
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const verifyReportAccessTokenFn = deps.verifyReportAccessToken ?? verifyReportAccessToken
  const getGoogleConnectionFn =
    deps.getGoogleSearchConsoleConnection ?? getGoogleSearchConsoleConnection
  const decryptTokenFn = deps.decryptToken ?? decryptToken
  const listPropertiesFn = deps.listSearchConsoleProperties ?? listSearchConsoleProperties
  const isPropertyMatchFn = deps.isSearchConsolePropertyMatch ?? isSearchConsolePropertyMatch
  const savePropertyFn = deps.saveScanSearchConsoleProperty ?? saveScanSearchConsoleProperty

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

    const { scanId, key, property } = body as Record<string, unknown>

    if (typeof scanId !== 'string' || !isUuid(scanId)) {
      return NextResponse.json({ error: 'Invalid or missing scan ID.' }, { status: 400 })
    }

    if (typeof key !== 'string' || !key.trim()) {
      return NextResponse.json({ error: 'Access key is required.' }, { status: 400 })
    }

    if (typeof property !== 'string' || !property.trim()) {
      return NextResponse.json({ error: 'Property identifier is required.' }, { status: 400 })
    }

    const trimmedProperty = property.trim()

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

    const connection = await getGoogleConnectionFn(scanId)
    if (!connection?.encryptedRefreshToken) {
      return NextResponse.json(
        { error: 'Google account is not connected for this scan.' },
        { status: 400 }
      )
    }

    let plainRefreshToken: string
    try {
      plainRefreshToken = decryptTokenFn(connection.encryptedRefreshToken)
    } catch {
      return NextResponse.json(
        { error: 'Failed to access stored Google credentials. Please reconnect.' },
        { status: 500 }
      )
    }

    let rawProperties
    try {
      rawProperties = await listPropertiesFn(plainRefreshToken)
    } catch (apiError) {
      const message =
        apiError instanceof Error
          ? apiError.message
          : 'Failed to verify Search Console properties with Google.'
      return NextResponse.json(
        { error: `Google Search Console API error: ${message}` },
        { status: 502 }
      )
    }

    // Server-side revalidation: submitted property must exactly match a live returned siteUrl
    const matchedEntry = rawProperties.find((entry) => entry.siteUrl === trimmedProperty)
    if (!matchedEntry) {
      return NextResponse.json(
        {
          error:
            'The selected property was not found in the connected Google Search Console account.',
        },
        { status: 400 }
      )
    }

    // Permission check
    if (
      !matchedEntry.permissionLevel ||
      !ALLOWED_SEARCH_CONSOLE_PERMISSIONS.has(matchedEntry.permissionLevel)
    ) {
      return NextResponse.json(
        {
          error:
            matchedEntry.permissionLevel === 'siteUnverifiedUser'
              ? 'The selected property is unverified in Google Search Console.'
              : 'The connected Google account does not have sufficient permission for this property.',
        },
        { status: 400 }
      )
    }

    // Target URL resolution: final_url ?? website_url
    const targetUrl = scan.final_url ?? scan.website_url

    const isMatch = isPropertyMatchFn(trimmedProperty, targetUrl)
    if (!isMatch) {
      return NextResponse.json(
        {
          error:
            'The selected Search Console property does not match the website analyzed by this scan.',
        },
        { status: 400 }
      )
    }

    // Persist exact Google siteUrl
    await savePropertyFn(scanId, trimmedProperty)

    return NextResponse.json({
      success: true,
      property: trimmedProperty,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to select Search Console property.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handleGooglePropertiesGet(request)
}

export async function POST(request: Request) {
  return handleGooglePropertiesPost(request)
}
