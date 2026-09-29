import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { searchconsole, type searchconsole_v1 } from '@googleapis/searchconsole'
import { sql } from './db'

export const GOOGLE_SEARCH_CONSOLE_RO_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

export const DEFAULT_OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

export interface GoogleSearchConsoleConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  stateSecret: string
  tokenEncryptionKey: string
}

export interface OAuthStatePayload {
  scanId: string
  nonce: string
  timestamp: number
  accessKey?: string
}

export interface GscProperty {
  siteUrl: string
  permissionLevel: string | null
}

/**
 * Stored Google Search Console connection record for a scan.
 *
 * Expiry semantics:
 * - `gsc_token_expires_at` is metadata from Google's token response.
 * - It represents the access-token expiry when supplied.
 * - Deep execution must refresh access tokens through the OAuth client.
 * - Expiry of this timestamp must not itself invalidate or delete the stored refresh token.
 */
export interface GoogleConnectionRecord {
  property: string | null
  encryptedRefreshToken: string | null
  tokenExpiresAt: string | null
  connectedAt: string | null
}

/**
 * Retrieve Google Search Console configuration from environment variables.
 * Throws immediately if any required variable is unconfigured.
 * Does not fall back to fake or hardcoded secrets.
 */
export function getGoogleSearchConsoleConfig(): GoogleSearchConsoleConfig {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI
  const stateSecret = process.env.GOOGLE_SEARCH_CONSOLE_STATE_SECRET
  const tokenEncryptionKey = process.env.GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY

  if (!clientId) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_CLIENT_ID is not configured.')
  }
  if (!clientSecret) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET is not configured.')
  }
  if (!redirectUri) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_REDIRECT_URI is not configured.')
  }
  if (!stateSecret) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_STATE_SECRET is not configured.')
  }
  if (!tokenEncryptionKey) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY is not configured.')
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    stateSecret,
    tokenEncryptionKey,
  }
}

/**
 * Parses and validates a 32-byte (256-bit) AES key.
 * Accepts a 64-character hex string, 44-character base64 string, or raw 32-character utf-8 string.
 */
export function parseEncryptionKey(keyInput?: string): Buffer {
  const key = keyInput ?? process.env.GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY is not configured.')
  }

  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex')
  }

  const utf8Buf = Buffer.from(key, 'utf8')
  if (utf8Buf.length === 32) {
    return utf8Buf
  }

  const b64Buf = Buffer.from(key, 'base64')
  if (b64Buf.length === 32) {
    return b64Buf
  }

  throw new Error(
    'GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY must represent exactly 32 bytes (256 bits).'
  )
}

/**
 * Encrypts a plain token using AES-256-GCM authenticated encryption.
 * Output format: <iv-hex>:<tag-hex>:<ciphertext-hex>
 */
export function encryptToken(plainToken: string, customKey?: string): string {
  if (!plainToken) {
    throw new Error('Token to encrypt cannot be empty.')
  }

  const keyBuffer = parseEncryptionKey(customKey)
  const iv = randomBytes(12) // NIST recommended 96-bit IV for AES-GCM
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv)

  const encrypted = Buffer.concat([cipher.update(plainToken, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypts an AES-256-GCM encrypted token.
 * Validates integrity via GCM authentication tag.
 * Never logs or prints token values.
 */
export function decryptToken(encryptedPayload: string, customKey?: string): string {
  if (!encryptedPayload) {
    throw new Error('Encrypted payload cannot be empty.')
  }

  const parts = encryptedPayload.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format.')
  }

  const [ivHex, tagHex, dataHex] = parts
  if (ivHex.length !== 24 || tagHex.length !== 32 || dataHex.length === 0) {
    throw new Error('Invalid encrypted token components.')
  }

  const keyBuffer = parseEncryptionKey(customKey)

  try {
    const decipher = createDecipheriv('aes-256-gcm', keyBuffer, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    throw new Error('Failed to decrypt token: authentication check failed.')
  }
}

/**
 * Derives a 32-byte key from the state secret for AES-256-GCM state encryption.
 */
function deriveStateKey(customSecret?: string): Buffer {
  const secret = customSecret ?? process.env.GOOGLE_SEARCH_CONSOLE_STATE_SECRET
  if (!secret) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_STATE_SECRET is not configured.')
  }
  return createHash('sha256').update(secret).digest()
}

/**
 * Creates an encrypted, tamper-proof, short-lived OAuth state bound to the scan ID.
 * Output format: base64url(iv):base64url(tag):base64url(ciphertext)
 */
export function createOAuthState(
  payload: { scanId: string; accessKey?: string },
  customSecret?: string
): string {
  const keyBuffer = deriveStateKey(customSecret)
  const nonce = randomBytes(16).toString('hex')
  const timestamp = Date.now()

  const stateData: OAuthStatePayload = {
    scanId: payload.scanId,
    nonce,
    timestamp,
    accessKey: payload.accessKey,
  }

  const jsonStr = JSON.stringify(stateData)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv)

  const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`
}

/**
 * Verifies and decrypts an OAuth state string.
 * Validates cryptographic authenticity, timestamp freshness, and payload structure.
 */
export function verifyOAuthState(
  stateString: string,
  customSecret?: string,
  options?: { maxAgeMs?: number }
): OAuthStatePayload {
  if (!stateString) {
    throw new Error('OAuth state cannot be empty.')
  }

  const parts = stateString.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid OAuth state format.')
  }

  const [ivB64, tagB64, cipherB64] = parts
  const keyBuffer = deriveStateKey(customSecret)

  let decryptedJson: string
  try {
    const decipher = createDecipheriv('aes-256-gcm', keyBuffer, Buffer.from(ivB64, 'base64url'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherB64, 'base64url')),
      decipher.final(),
    ])
    decryptedJson = decrypted.toString('utf8')
  } catch {
    throw new Error('Invalid OAuth state signature.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(decryptedJson)
  } catch {
    throw new Error('Corrupted OAuth state payload.')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid OAuth state structure.')
  }

  const payload = parsed as Partial<OAuthStatePayload>
  if (!payload.scanId || typeof payload.scanId !== 'string') {
    throw new Error('OAuth state missing valid scan ID.')
  }
  if (!payload.nonce || typeof payload.nonce !== 'string') {
    throw new Error('OAuth state missing valid nonce.')
  }
  if (typeof payload.timestamp !== 'number') {
    throw new Error('OAuth state missing timestamp.')
  }

  const maxAgeMs = options?.maxAgeMs ?? DEFAULT_OAUTH_STATE_MAX_AGE_MS
  const now = Date.now()
  if (now - payload.timestamp > maxAgeMs) {
    throw new Error('OAuth state has expired.')
  }
  if (payload.timestamp > now + 60 * 1000) {
    throw new Error('OAuth state timestamp is in the future.')
  }

  return {
    scanId: payload.scanId,
    nonce: payload.nonce,
    timestamp: payload.timestamp,
    accessKey: payload.accessKey,
  }
}

/**
 * Computes a SHA-256 hash of an OAuth state string for database persistence and replay protection.
 */
export function hashOAuthState(stateString: string): string {
  return createHash('sha256').update(stateString).digest('hex')
}

/**
 * Instantiates a google-auth-library OAuth2Client using configuration.
 */
export function createOAuth2Client(
  configOverride?: Partial<GoogleSearchConsoleConfig>
): OAuth2Client {
  const config = {
    clientId: configOverride?.clientId ?? process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
    clientSecret: configOverride?.clientSecret ?? process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
    redirectUri: configOverride?.redirectUri ?? process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI,
  }

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error(
      'Google Search Console OAuth credentials (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) are not configured.'
    )
  }

  return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri)
}

/**
 * Generates the Google OAuth authorization URL requesting read-only Search Console access.
 * Enforces offline access type, read-only scope, and consent prompt.
 */
export function createOAuthAuthorizationUrl(options?: {
  state?: string
  prompt?: string
  config?: Partial<GoogleSearchConsoleConfig>
}): string {
  const client = createOAuth2Client(options?.config)

  return client.generateAuthUrl({
    access_type: 'offline',
    include_granted_scopes: true,
    scope: GOOGLE_SEARCH_CONSOLE_RO_SCOPE,
    state: options?.state,
    prompt: options?.prompt ?? 'consent',
  })
}

/**
 * Exchanges an OAuth callback authorization code for tokens.
 * Requires a refresh token for durable server-side Deep access.
 * Never logs or prints authorization codes or token values.
 */
export async function exchangeCodeForTokens(
  code: string,
  configOverride?: Partial<GoogleSearchConsoleConfig>
): Promise<{
  accessToken?: string
  refreshToken: string
  expiryDate?: number | null
  scope?: string
}> {
  if (!code) {
    throw new Error('Authorization code is required for token exchange.')
  }

  const client = createOAuth2Client(configOverride)
  const { tokens } = await client.getToken(code)

  if (!tokens.refresh_token) {
    throw new Error(
      'Google OAuth exchange did not return a refresh token. Offline consent is required.'
    )
  }

  return {
    accessToken: tokens.access_token ?? undefined,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date ?? null,
    scope: tokens.scope ?? undefined,
  }
}

/**
 * Creates an authenticated Google Search Console v1 client from a stored refresh token.
 */
export function createSearchConsoleClient(
  refreshToken: string,
  configOverride?: Partial<GoogleSearchConsoleConfig>
): searchconsole_v1.Searchconsole {
  if (!refreshToken) {
    throw new Error('Refresh token is required to create an authenticated client.')
  }

  const oauth2Client = createOAuth2Client(configOverride)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  return searchconsole({
    version: 'v1',
    auth: oauth2Client as never,
  })
}

/**
 * Lists the authenticated user's Search Console properties.
 * Accepts an initialized Search Console client, an OAuth2Client, or a plain refresh token.
 */
export async function listSearchConsoleProperties(
  authOrToken: searchconsole_v1.Searchconsole | OAuth2Client | string,
  configOverride?: Partial<GoogleSearchConsoleConfig>
): Promise<GscProperty[]> {
  let client: searchconsole_v1.Searchconsole

  if (typeof authOrToken === 'string') {
    client = createSearchConsoleClient(authOrToken, configOverride)
  } else if ('sites' in authOrToken && typeof authOrToken.sites?.list === 'function') {
    client = authOrToken
  } else {
    client = searchconsole({
      version: 'v1',
      auth: authOrToken as never,
    })
  }

  const response = await client.sites.list()
  const siteEntries = response.data?.siteEntry ?? []

  return siteEntries.map((entry) => ({
    siteUrl: entry.siteUrl ?? '',
    permissionLevel: entry.permissionLevel ?? null,
  }))
}

// ── Database Persistence Helpers ─────────────────────────────────────────────

/**
 * Saves a hashed OAuth state to seo_scans for replay protection.
 */
export async function saveScanOAuthStateHash(scanId: string, stateHash: string): Promise<void> {
  await sql`
    update seo_scans
    set
      gsc_oauth_state_hash = ${stateHash},
      updated_at = now()
    where id = ${scanId}::uuid
  `
}

/**
 * Verifies and atomically consumes the OAuth state hash from seo_scans.
 * Returns true if the state matched and was consumed; false otherwise.
 * A second attempt with the same state will always return false.
 */
export async function verifyAndConsumeScanOAuthState(
  scanId: string,
  stateHash: string
): Promise<boolean> {
  const rows = await sql`
    update seo_scans
    set
      gsc_oauth_state_hash = null,
      updated_at = now()
    where id = ${scanId}::uuid
      and gsc_oauth_state_hash = ${stateHash}
    returning id
  `
  return rows.length > 0
}

/**
 * Stores the encrypted refresh token and metadata on the scan record.
 * Never stores refresh tokens in plaintext.
 *
 * Token expiry semantics:
 * - `gsc_token_expires_at` is metadata from Google's token response representing
 *   the access-token expiry when supplied.
 * - Deep execution must refresh access tokens through the OAuth client.
 * - Expiry of this timestamp must not itself invalidate or delete the stored refresh token.
 *
 * Property selection (Phase 10B/10C):
 * - Keeps `gsc_property = null` unless an explicit property is already supplied by a trusted flow.
 */
export async function saveGoogleSearchConsoleConnection(input: {
  scanId: string
  encryptedRefreshToken: string
  tokenExpiresAt?: string | null
  property?: string | null
}): Promise<void> {
  await sql`
    update seo_scans
    set
      gsc_refresh_token_encrypted = ${input.encryptedRefreshToken},
      gsc_token_expires_at = ${input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : null},
      gsc_connected_at = now(),
      gsc_property = coalesce(${input.property ?? null}, gsc_property),
      updated_at = now()
    where id = ${input.scanId}::uuid
  `
}

/**
 * Retrieves the Google Search Console connection metadata for a scan.
 */
export async function getGoogleSearchConsoleConnection(
  scanId: string
): Promise<GoogleConnectionRecord | null> {
  const rows = await sql`
    select
      gsc_property,
      gsc_refresh_token_encrypted,
      gsc_token_expires_at,
      gsc_connected_at
    from seo_scans
    where id = ${scanId}::uuid
    limit 1
  `

  if (!rows[0]) return null

  return {
    property: (rows[0].gsc_property as string) ?? null,
    encryptedRefreshToken: (rows[0].gsc_refresh_token_encrypted as string) ?? null,
    tokenExpiresAt: rows[0].gsc_token_expires_at
      ? new Date(rows[0].gsc_token_expires_at as string).toISOString()
      : null,
    connectedAt: rows[0].gsc_connected_at
      ? new Date(rows[0].gsc_connected_at as string).toISOString()
      : null,
  }
}
