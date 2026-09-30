import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'
}

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  createOAuthAuthorizationUrl,
  createOAuthState,
  decryptToken,
  encryptToken,
  exchangeCodeForTokens,
  hashOAuthState,
  listSearchConsoleProperties,
  verifyOAuthState,
  GOOGLE_SEARCH_CONSOLE_RO_SCOPE,
  createSearchConsoleClient,
  isSearchConsolePropertyMatch,
  saveScanSearchConsoleProperty,
  ALLOWED_SEARCH_CONSOLE_PERMISSIONS,
} = require('./google-search-console')
const { handleGoogleConnect } = require('../../app/api/technical-seo/google/connect/route')
const { handleGoogleCallback } = require('../../app/api/technical-seo/google/callback/route')
const {
  handleGooglePropertiesGet,
  handleGooglePropertiesPost,
} = require('../../app/api/technical-seo/google/properties/route')
const { hashReportAccessToken } = require('./scan-repository')
/* eslint-enable @typescript-eslint/no-require-imports */

interface TestConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  stateSecret: string
  tokenEncryptionKey: string
}

const TEST_CONFIG: TestConfig = {
  clientId: 'mock-client-id.apps.googleusercontent.com',
  clientSecret: 'mock-client-secret-123',
  redirectUri: 'https://www.locitra.com/api/technical-seo/google/callback',
  stateSecret: 'test-crypto-state-secret-for-unit-tests-32b!',
  tokenEncryptionKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32 bytes hex
}

const TEST_SCAN_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d'
const TEST_ACCESS_KEY = 'locitra_test_access_key_12345'
const TEST_KEY_HASH = hashReportAccessToken(TEST_ACCESS_KEY)

describe('Phase 10B — Google Search Console OAuth Foundation', () => {
  describe('Authorization URL Generation', () => {
    it('authorization URL contains the read-only Search Console scope', () => {
      const urlString = createOAuthAuthorizationUrl({
        state: 'test-state-token',
        config: TEST_CONFIG,
      })
      const url = new URL(urlString)

      assert.strictEqual(url.searchParams.get('scope'), GOOGLE_SEARCH_CONSOLE_RO_SCOPE)
      assert.strictEqual(url.searchParams.get('scope')?.includes('webmasters.readonly'), true)
      // Confirm NO write access scope
      assert.strictEqual(
        url.searchParams.get('scope')?.includes('https://www.googleapis.com/auth/webmasters '),
        false
      )
    })

    it('offline access is requested', () => {
      const urlString = createOAuthAuthorizationUrl({
        state: 'test-state-token',
        config: TEST_CONFIG,
      })
      const url = new URL(urlString)

      assert.strictEqual(url.searchParams.get('access_type'), 'offline')
      assert.strictEqual(url.searchParams.get('include_granted_scopes'), 'true')
      assert.strictEqual(url.searchParams.get('prompt'), 'consent')
    })

    it('state is present in authorization URL', () => {
      const expectedState = 'test-random-state-12345'
      const urlString = createOAuthAuthorizationUrl({
        state: expectedState,
        config: TEST_CONFIG,
      })
      const url = new URL(urlString)

      assert.strictEqual(url.searchParams.get('state'), expectedState)
    })
  })

  describe('OAuth State Security & Validation', () => {
    it('creates state bound to scanId and validates correctly', () => {
      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      assert.ok(state)
      assert.strictEqual(typeof state, 'string')

      const payload = verifyOAuthState(state, TEST_CONFIG.stateSecret)
      assert.strictEqual(payload.scanId, TEST_SCAN_ID)
      assert.strictEqual(payload.accessKey, TEST_ACCESS_KEY)
      assert.ok(payload.nonce)
      assert.ok(payload.timestamp > 0)
    })

    it('invalid state is rejected (tampered content)', () => {
      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      const parts = state.split('.')
      // Tamper ciphertext
      const tamperedParts = [parts[0], parts[1], parts[2].slice(0, -2) + 'AA']
      const tamperedState = tamperedParts.join('.')

      assert.throws(
        () => verifyOAuthState(tamperedState, TEST_CONFIG.stateSecret),
        /Invalid OAuth state signature/
      )
    })

    it('invalid state is rejected (corrupted format)', () => {
      assert.throws(
        () => verifyOAuthState('not-a-valid-state', TEST_CONFIG.stateSecret),
        /Invalid OAuth state format/
      )
      assert.throws(
        () => verifyOAuthState('', TEST_CONFIG.stateSecret),
        /OAuth state cannot be empty/
      )
    })

    it('expired state is rejected', () => {
      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      // Force verification with maxAgeMs = -1 (instant expiry)
      assert.throws(
        () =>
          verifyOAuthState(state, TEST_CONFIG.stateSecret, {
            maxAgeMs: -1,
          }),
        /OAuth state has expired/
      )
    })
  })

  describe('Token Encryption & Protection', () => {
    const rawRefreshToken = '1//04test_mock_refresh_token_very_confidential_987654321'

    it('refresh token is stored encrypted rather than plaintext', () => {
      const encrypted = encryptToken(rawRefreshToken, TEST_CONFIG.tokenEncryptionKey)

      // Encrypted representation must not be plaintext
      assert.notStrictEqual(encrypted, rawRefreshToken)
      assert.strictEqual(encrypted.includes(rawRefreshToken), false)

      // Format must be iv:tag:ciphertext (3 components)
      const parts = encrypted.split(':')
      assert.strictEqual(parts.length, 3)
      assert.strictEqual(parts[0].length, 24) // 12-byte IV in hex
      assert.strictEqual(parts[1].length, 32) // 16-byte tag in hex
      assert.ok(parts[2].length > 0) // Ciphertext

      // Decryption must yield exact original
      const decrypted = decryptToken(encrypted, TEST_CONFIG.tokenEncryptionKey)
      assert.strictEqual(decrypted, rawRefreshToken)
    })

    it('tampered encrypted token fails decryption safely', () => {
      const encrypted = encryptToken(rawRefreshToken, TEST_CONFIG.tokenEncryptionKey)
      const parts = encrypted.split(':')
      const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}00`

      assert.throws(
        () => decryptToken(tampered, TEST_CONFIG.tokenEncryptionKey),
        /authentication check failed/
      )
    })

    it('no token value is written to logs/errors', async () => {
      const loggedMessages: string[] = []
      const originalConsoleError = console.error
      const originalConsoleLog = console.log

      console.error = (...args: unknown[]) => {
        loggedMessages.push(args.map(String).join(' '))
      }
      console.log = (...args: unknown[]) => {
        loggedMessages.push(args.map(String).join(' '))
      }

      try {
        const encrypted = encryptToken(rawRefreshToken, TEST_CONFIG.tokenEncryptionKey)
        decryptToken(encrypted, TEST_CONFIG.tokenEncryptionKey)

        // Attempt invalid decrypt to produce error
        try {
          decryptToken('invalid:format', TEST_CONFIG.tokenEncryptionKey)
        } catch {
          // Expected
        }

        for (const log of loggedMessages) {
          assert.strictEqual(
            log.includes(rawRefreshToken),
            false,
            'Token must never be written to logs.'
          )
        }
      } finally {
        console.error = originalConsoleError
        console.log = originalConsoleLog
      }
    })
  })

  describe('Connect Route (handleGoogleConnect)', () => {
    it('missing scan is rejected with 404', async () => {
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/connect?scanId=${TEST_SCAN_ID}&key=${TEST_ACCESS_KEY}`
      )

      const response = await handleGoogleConnect(request, {
        getScanRecord: async () => null,
      })

      assert.strictEqual(response.status, 404)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(body.error, 'Scan not found.')
    })

    it('invalid scan ID is rejected with 400', async () => {
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/connect?scanId=invalid-uuid&key=${TEST_ACCESS_KEY}`
      )

      const response = await handleGoogleConnect(request)
      assert.strictEqual(response.status, 400)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(body.error, 'Invalid scan ID.')
    })

    it('missing access key is rejected with 400', async () => {
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/connect?scanId=${TEST_SCAN_ID}`
      )

      const response = await handleGoogleConnect(request)
      assert.strictEqual(response.status, 400)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(body.error, 'Access key is required.')
    })

    it('invalid access key is rejected with 403', async () => {
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/connect?scanId=${TEST_SCAN_ID}&key=wrong-key`
      )

      const response = await handleGoogleConnect(request, {
        getScanRecord: async () => ({
          id: TEST_SCAN_ID,
          plan: 'deep',
          access_mode: 'private',
          report_token_hash: TEST_KEY_HASH,
        }),
      })

      assert.strictEqual(response.status, 403)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(body.error, 'Invalid access key.')
    })

    it('non-Deep scan is rejected by connect route (quick)', async () => {
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/connect?scanId=${TEST_SCAN_ID}&key=${TEST_ACCESS_KEY}`
      )

      const response = await handleGoogleConnect(request, {
        getScanRecord: async () => ({
          id: TEST_SCAN_ID,
          plan: 'quick',
          access_mode: 'private',
          report_token_hash: TEST_KEY_HASH,
        }),
      })

      assert.strictEqual(response.status, 400)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(
        body.error,
        'Google Search Console connection is only available for Deep Investigation scans.'
      )
    })

    it('non-Deep scan is rejected by connect route (full)', async () => {
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/connect?scanId=${TEST_SCAN_ID}&key=${TEST_ACCESS_KEY}`
      )

      const response = await handleGoogleConnect(request, {
        getScanRecord: async () => ({
          id: TEST_SCAN_ID,
          plan: 'full',
          access_mode: 'private',
          report_token_hash: TEST_KEY_HASH,
        }),
      })

      assert.strictEqual(response.status, 400)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(
        body.error,
        'Google Search Console connection is only available for Deep Investigation scans.'
      )
    })

    it('non-Deep scan is rejected by connect route (free)', async () => {
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/connect?scanId=${TEST_SCAN_ID}&key=${TEST_ACCESS_KEY}`
      )

      const response = await handleGoogleConnect(request, {
        getScanRecord: async () => ({
          id: TEST_SCAN_ID,
          plan: 'free',
          access_mode: 'private',
          report_token_hash: TEST_KEY_HASH,
        }),
      })

      assert.strictEqual(response.status, 400)
    })

    it('valid Deep scan creates state and redirects to Google authorization URL', async () => {
      let savedScanId: string | null = null
      let savedStateHash: string | null = null

      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/connect?scanId=${TEST_SCAN_ID}&key=${TEST_ACCESS_KEY}`
      )

      const response = await handleGoogleConnect(request, {
        getScanRecord: async () => ({
          id: TEST_SCAN_ID,
          plan: 'deep',
          access_mode: 'private',
          report_token_hash: TEST_KEY_HASH,
        }),
        saveScanOAuthStateHash: async (scanId: string, stateHash: string) => {
          savedScanId = scanId
          savedStateHash = stateHash
        },
        createOAuthAuthorizationUrl: ({ state }: { state?: string }) =>
          `https://accounts.google.com/o/oauth2/v2/auth?client_id=mock&scope=ro&state=${state}`,
        createOAuthState: ({ scanId, accessKey }: { scanId: string; accessKey?: string }) =>
          createOAuthState({ scanId, accessKey }, TEST_CONFIG.stateSecret),
      })

      assert.strictEqual(response.status, 307)
      const redirectLocation = response.headers.get('location')
      assert.ok(redirectLocation?.includes('accounts.google.com'))
      assert.ok(redirectLocation?.includes('state='))

      assert.strictEqual(savedScanId, TEST_SCAN_ID)
      assert.ok(savedStateHash)
    })
  })

  describe('Callback Route (handleGoogleCallback)', () => {
    it('token response without refresh token is rejected', async () => {
      // Direct service function test
      await assert.rejects(async () => {
        await exchangeCodeForTokens('test-code-no-refresh', {
          ...TEST_CONFIG,
        })
      }, /Error/)

      // Route handler test
      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/callback?code=mock-code&state=${encodeURIComponent(
          state
        )}`
      )

      const response = await handleGoogleCallback(request, {
        verifyOAuthState: () => ({
          scanId: TEST_SCAN_ID,
          accessKey: TEST_ACCESS_KEY,
          nonce: 'nonce123',
          timestamp: Date.now(),
        }),
        verifyAndConsumeScanOAuthState: async () => true,
        getScanRecord: async () =>
          ({
            id: TEST_SCAN_ID,
            plan: 'deep',
            access_mode: 'private',
            report_token_hash: TEST_KEY_HASH,
          }) as never,
        exchangeCodeForTokens: async () => {
          throw new Error('Google OAuth exchange did not return a refresh token.')
        },
      })

      assert.strictEqual(response.status, 400)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(body.error.includes('did not return a refresh token'), true)
    })

    it('rejects callback if state replay is attempted', async () => {
      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/callback?code=mock-code&state=${encodeURIComponent(
          state
        )}`
      )

      // verifyAndConsumeScanOAuthState returns false (simulating state already consumed)
      const response = await handleGoogleCallback(request, {
        verifyOAuthState: () => ({
          scanId: TEST_SCAN_ID,
          accessKey: TEST_ACCESS_KEY,
          nonce: 'nonce123',
          timestamp: Date.now(),
        }),
        verifyAndConsumeScanOAuthState: async () => false,
      })

      assert.strictEqual(response.status, 400)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(body.error, 'OAuth state has already been used or is invalid.')
    })

    it('rejects callback safely if scan does not exist (404)', async () => {
      let exchangeCalled = false
      let saveCalled = false

      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/callback?code=mock-auth-code&state=${encodeURIComponent(
          state
        )}`
      )

      const response = await handleGoogleCallback(request, {
        verifyOAuthState: () => ({
          scanId: TEST_SCAN_ID,
          accessKey: TEST_ACCESS_KEY,
          nonce: 'nonce123',
          timestamp: Date.now(),
        }),
        verifyAndConsumeScanOAuthState: async () => true,
        getScanRecord: async () => null,
        exchangeCodeForTokens: async () => {
          exchangeCalled = true
          return { refreshToken: 'mock-refresh' }
        },
        saveGoogleSearchConsoleConnection: async () => {
          saveCalled = true
        },
      })

      assert.strictEqual(response.status, 404)
      const body = (await response.json()) as { error: string }
      assert.strictEqual(body.error, 'Scan not found.')
      assert.strictEqual(exchangeCalled, false, 'Must not exchange tokens if scan does not exist')
      assert.strictEqual(saveCalled, false, 'Must not save connection if scan does not exist')
    })

    it('rejects callback safely if scan plan is not deep (400)', async () => {
      for (const nonDeepPlan of ['quick', 'full', 'free']) {
        let exchangeCalled = false
        let saveCalled = false

        const state = createOAuthState(
          { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
          TEST_CONFIG.stateSecret
        )
        const request = new Request(
          `http://localhost:3000/api/technical-seo/google/callback?code=mock-auth-code&state=${encodeURIComponent(
            state
          )}`
        )

        const response = await handleGoogleCallback(request, {
          verifyOAuthState: () => ({
            scanId: TEST_SCAN_ID,
            accessKey: TEST_ACCESS_KEY,
            nonce: 'nonce123',
            timestamp: Date.now(),
          }),
          verifyAndConsumeScanOAuthState: async () => true,
          getScanRecord: async () =>
            ({
              id: TEST_SCAN_ID,
              plan: nonDeepPlan,
              access_mode: 'private',
            }) as never,
          exchangeCodeForTokens: async () => {
            exchangeCalled = true
            return { refreshToken: 'mock-refresh' }
          },
          saveGoogleSearchConsoleConnection: async () => {
            saveCalled = true
          },
        })

        assert.strictEqual(response.status, 400)
        const body = (await response.json()) as { error: string }
        assert.strictEqual(
          body.error,
          'Google Search Console connection is only available for Deep Investigation scans.'
        )
        assert.strictEqual(
          exchangeCalled,
          false,
          `Must not exchange tokens for non-deep plan ${nonDeepPlan}`
        )
        assert.strictEqual(
          saveCalled,
          false,
          `Must not save connection for non-deep plan ${nonDeepPlan}`
        )
      }
    })

    it('successful callback stores encrypted token and redirects to scan status without exposing credentials', async () => {
      let savedConnection: {
        scanId: string
        encryptedRefreshToken: string
        tokenExpiresAt?: string | null
        property?: string | null
      } | null = null

      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      const mockRefreshToken = '1//04test_mock_refresh_token_valid_12345'

      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/callback?code=mock-auth-code&state=${encodeURIComponent(
          state
        )}`
      )

      const response = await handleGoogleCallback(request, {
        verifyOAuthState: () => ({
          scanId: TEST_SCAN_ID,
          accessKey: TEST_ACCESS_KEY,
          nonce: 'nonce123',
          timestamp: Date.now(),
        }),
        verifyAndConsumeScanOAuthState: async () => true,
        getScanRecord: async () =>
          ({
            id: TEST_SCAN_ID,
            plan: 'deep',
            access_mode: 'private',
            report_token_hash: TEST_KEY_HASH,
          }) as never,
        exchangeCodeForTokens: async () => ({
          accessToken: 'mock-access-token-ignored',
          refreshToken: mockRefreshToken,
          expiryDate: Date.now() + 3600000,
        }),
        encryptToken: (plainToken: string) =>
          encryptToken(plainToken, TEST_CONFIG.tokenEncryptionKey),
        saveGoogleSearchConsoleConnection: async (input: {
          scanId: string
          encryptedRefreshToken: string
          tokenExpiresAt?: string | null
          property?: string | null
        }) => {
          savedConnection = input
        },
      })

      // Verify redirect status
      assert.strictEqual(response.status, 307)
      const location = response.headers.get('location')
      assert.ok(location)

      // Verify destination is scan status page
      const redirectUrl = new URL(location, 'http://localhost:3000')
      assert.strictEqual(redirectUrl.pathname, `/technical-seo/scan/${TEST_SCAN_ID}/`)
      assert.strictEqual(redirectUrl.searchParams.get('key'), TEST_ACCESS_KEY)
      assert.strictEqual(redirectUrl.searchParams.get('gsc'), 'connected')

      // CRITICAL: Credentials must NOT appear in URL
      assert.strictEqual(location.includes(mockRefreshToken), false)
      assert.strictEqual(location.includes('mock-access-token'), false)
      assert.strictEqual(location.includes('mock-auth-code'), false)

      // Verify encrypted token storage
      assert.ok(savedConnection)
      const conn = savedConnection as {
        scanId: string
        encryptedRefreshToken: string
        tokenExpiresAt?: string | null
        property?: string | null
      }
      assert.strictEqual(conn.scanId, TEST_SCAN_ID)
      assert.notStrictEqual(conn.encryptedRefreshToken, mockRefreshToken)
      assert.strictEqual(conn.encryptedRefreshToken.includes(mockRefreshToken), false)
      // Phase 10B/10C: Confirm property is not auto-selected
      assert.strictEqual(conn.property ?? null, null)

      // Verify stored encrypted token can be decrypted
      const decrypted = decryptToken(conn.encryptedRefreshToken, TEST_CONFIG.tokenEncryptionKey)
      assert.strictEqual(decrypted, mockRefreshToken)
    })

    it('handles Google error query parameter safely', async () => {
      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      const request = new Request(
        `http://localhost:3000/api/technical-seo/google/callback?error=access_denied&state=${encodeURIComponent(
          state
        )}`
      )

      const response = await handleGoogleCallback(request, {
        verifyOAuthState: (st: string) => verifyOAuthState(st, TEST_CONFIG.stateSecret),
        verifyAndConsumeScanOAuthState: async () => true,
      })

      assert.strictEqual(response.status, 307)
      const location = response.headers.get('location')
      assert.ok(location)

      const redirectUrl = new URL(location, 'http://localhost:3000')
      assert.strictEqual(redirectUrl.pathname, `/technical-seo/scan/${TEST_SCAN_ID}/`)
      assert.strictEqual(redirectUrl.searchParams.get('key'), TEST_ACCESS_KEY)
      assert.strictEqual(redirectUrl.searchParams.get('gsc_error'), 'access_denied')
    })

    it('OAuth error callback consumes state and rejects replay attempts', async () => {
      let stateConsumed = false
      const state = createOAuthState(
        { scanId: TEST_SCAN_ID, accessKey: TEST_ACCESS_KEY },
        TEST_CONFIG.stateSecret
      )
      const expectedStateHash = hashOAuthState(state)
      let activeStateHash: string | null = expectedStateHash

      const mockDeps = {
        verifyOAuthState: (st: string) => verifyOAuthState(st, TEST_CONFIG.stateSecret),
        hashOAuthState,
        verifyAndConsumeScanOAuthState: async (_scanId: string, hash: string) => {
          if (activeStateHash === hash) {
            activeStateHash = null
            stateConsumed = true
            return true
          }
          return false
        },
      }

      const request1 = new Request(
        `http://localhost:3000/api/technical-seo/google/callback?error=access_denied&state=${encodeURIComponent(
          state
        )}`
      )

      // First attempt: state is valid and consumed -> redirects safely with gsc_error
      const response1 = await handleGoogleCallback(request1, mockDeps)
      assert.strictEqual(response1.status, 307)
      const location1 = response1.headers.get('location')
      assert.ok(location1)
      const redirectUrl1 = new URL(location1, 'http://localhost:3000')
      assert.strictEqual(redirectUrl1.pathname, `/technical-seo/scan/${TEST_SCAN_ID}/`)
      assert.strictEqual(redirectUrl1.searchParams.get('key'), TEST_ACCESS_KEY)
      assert.strictEqual(redirectUrl1.searchParams.get('gsc_error'), 'access_denied')
      assert.strictEqual(stateConsumed, true, 'State must be atomically consumed on error callback')

      // Second attempt with the same state: state already consumed -> must reject with 400
      const request2 = new Request(
        `http://localhost:3000/api/technical-seo/google/callback?error=access_denied&state=${encodeURIComponent(
          state
        )}`
      )
      const response2 = await handleGoogleCallback(request2, mockDeps)
      assert.strictEqual(response2.status, 400)
      const body2 = (await response2.json()) as { error: string }
      assert.strictEqual(body2.error, 'OAuth state has already been used or is invalid.')
    })
  })

  describe('Search Console Service Helpers', () => {
    it('creates authenticated Search Console client structure', () => {
      const client = createSearchConsoleClient('mock-refresh-token', TEST_CONFIG)
      assert.ok(client)
      assert.strictEqual(typeof client.sites?.list, 'function')
    })

    it('listSearchConsoleProperties maps site entries', async () => {
      const mockSitesClient = {
        sites: {
          list: async () => ({
            data: {
              siteEntry: [
                {
                  siteUrl: 'https://example.com/',
                  permissionLevel: 'siteOwner',
                },
                {
                  siteUrl: 'sc-domain:example.com',
                  permissionLevel: 'siteFullUser',
                },
              ],
            },
          }),
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const properties = await listSearchConsoleProperties(mockSitesClient as any)
      assert.strictEqual(properties.length, 2)
      assert.strictEqual(properties[0].siteUrl, 'https://example.com/')
      assert.strictEqual(properties[0].permissionLevel, 'siteOwner')
      assert.strictEqual(properties[1].siteUrl, 'sc-domain:example.com')
      assert.strictEqual(properties[1].permissionLevel, 'siteFullUser')
    })

    it('hashOAuthState produces consistent SHA-256 hex string', () => {
      const hash1 = hashOAuthState('test-state-string')
      const hash2 = hashOAuthState('test-state-string')
      assert.strictEqual(hash1, hash2)
      assert.strictEqual(hash1.length, 64)
    })
  })
})

describe('Phase 10C — Google Search Console Property Selection', () => {
  function createMockScan(overrides?: Record<string, unknown>) {
    return {
      id: TEST_SCAN_ID,
      website_url: 'https://example.com/',
      final_url: null,
      plan: 'deep',
      report_token_hash: TEST_KEY_HASH,
      access_mode: 'private',
      status: 'queued',
      ...overrides,
    }
  }

  function createMockConnection(overrides?: Record<string, unknown>) {
    return {
      property: null,
      encryptedRefreshToken: encryptToken('test-refresh-token', TEST_CONFIG.tokenEncryptionKey),
      tokenExpiresAt: null,
      connectedAt: new Date().toISOString(),
      ...overrides,
    }
  }

  describe('Pure Property Matcher (isSearchConsolePropertyMatch)', () => {
    // 1. sc-domain:example.com -> https://example.com/
    it('1. sc-domain:example.com matches https://example.com/', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:example.com', 'https://example.com/'),
        true
      )
    })

    // 2. sc-domain:example.com -> https://www.example.com/
    it('2. sc-domain:example.com matches https://www.example.com/', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:example.com', 'https://www.example.com/'),
        true
      )
    })

    // 3. sc-domain:example.com -> https://blog.example.com/article
    it('3. sc-domain:example.com matches https://blog.example.com/article', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:example.com', 'https://blog.example.com/article'),
        true
      )
    })

    // 4. sc-domain:example.com does NOT match https://badexample.com/
    it('4. sc-domain:example.com does NOT match https://badexample.com/', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:example.com', 'https://badexample.com/'),
        false
      )
    })

    // 5. sc-domain:www.example.com does NOT match https://example.com/
    it('5. sc-domain:www.example.com does NOT match https://example.com/', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:www.example.com', 'https://example.com/'),
        false
      )
    })

    // 6. https://www.example.com/ -> https://www.example.com/article
    it('6. https://www.example.com/ matches https://www.example.com/article', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://www.example.com/', 'https://www.example.com/article'),
        true
      )
    })

    // 7. https://www.example.com/ does NOT match https://example.com/
    it('7. https://www.example.com/ does NOT match https://example.com/', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://www.example.com/', 'https://example.com/'),
        false
      )
    })

    // 8. http://example.com/ does NOT match https://example.com/
    it('8. http://example.com/ does NOT match https://example.com/', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('http://example.com/', 'https://example.com/'),
        false
      )
    })

    // 9. https://example.com/blog/ -> https://example.com/blog/post
    it('9. https://example.com/blog/ matches https://example.com/blog/post', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://example.com/blog/', 'https://example.com/blog/post'),
        true
      )
    })

    // 10. https://example.com/blog/ does NOT match https://example.com/blog-news
    it('10. https://example.com/blog/ does NOT match https://example.com/blog-news', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://example.com/blog/', 'https://example.com/blog-news'),
        false
      )
    })

    // 11. https://example.com/blog/ does NOT match https://example.com/
    it('11. https://example.com/blog/ does NOT match https://example.com/', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://example.com/blog/', 'https://example.com/'),
        false
      )
    })

    // 12. protocol mismatch
    it('12. protocol mismatch returns false', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://example.com/', 'http://example.com/'),
        false
      )
      assert.strictEqual(
        isSearchConsolePropertyMatch('http://example.com/', 'https://example.com/'),
        false
      )
    })

    // 13. port mismatch where meaningful
    it('13. port mismatch returns false', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://example.com:8443/', 'https://example.com/'),
        false
      )
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://example.com:443/', 'https://example.com/'),
        true
      )
    })

    // 14. trailing slash handling
    it('14. trailing slash normalization behaves safely', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://example.com', 'https://example.com/'),
        true
      )
      assert.strictEqual(
        isSearchConsolePropertyMatch('https://example.com/', 'https://example.com'),
        true
      )
    })

    // 15. malformed target returns false
    it('15. malformed target returns false without throwing', () => {
      assert.strictEqual(isSearchConsolePropertyMatch('sc-domain:example.com', ''), false)
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:example.com', 'not-a-valid-url'),
        false
      )
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:example.com', 'javascript:alert(1)'),
        false
      )
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:example.com', 'example.com'),
        false
      )
    })

    // 16. malformed property returns false
    it('16. malformed property returns false without throwing', () => {
      assert.strictEqual(isSearchConsolePropertyMatch('', 'https://example.com/'), false)
      assert.strictEqual(isSearchConsolePropertyMatch('sc-domain:', 'https://example.com/'), false)
      assert.strictEqual(
        isSearchConsolePropertyMatch('sc-domain:..', 'https://example.com/'),
        false
      )
      assert.strictEqual(
        isSearchConsolePropertyMatch('not-a-property', 'https://example.com/'),
        false
      )
      assert.strictEqual(
        isSearchConsolePropertyMatch('ftp://example.com/', 'https://example.com/'),
        false
      )
    })

    // 17. arbitrary example.com/path is NOT treated as a domain property
    it('17. arbitrary scheme-less example.com/path is NOT treated as a domain property', () => {
      assert.strictEqual(
        isSearchConsolePropertyMatch('example.com/path', 'https://example.com/path'),
        false
      )
      assert.strictEqual(isSearchConsolePropertyMatch('example.com', 'https://example.com/'), false)
    })
  })

  describe('Target URL Resolution & Property Selection Security', () => {
    // 18. final_url is preferred over website_url
    it('18. final_url is preferred over website_url and strictly enforced', async () => {
      const scanWithRedirect = createMockScan({
        website_url: 'https://example.com/',
        final_url: 'https://www.example.com/',
      })

      const reqGet = new Request(
        `https://www.locitra.com/api/technical-seo/google/properties?scanId=${TEST_SCAN_ID}&key=${TEST_ACCESS_KEY}`
      )

      const response = await handleGooglePropertiesGet(reqGet, {
        getScanRecord: async () => scanWithRedirect as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
        decryptToken: () => 'test-refresh-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'https://example.com/', permissionLevel: 'siteOwner' },
          { siteUrl: 'https://www.example.com/', permissionLevel: 'siteOwner' },
        ],
      })

      assert.strictEqual(response.status, 200)
      const data = await response.json()
      assert.strictEqual(data.targetUrl, 'https://www.example.com/')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apexProp = data.properties.find((p: any) => p.siteUrl === 'https://example.com/')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wwwProp = data.properties.find((p: any) => p.siteUrl === 'https://www.example.com/')

      // Because final_url is https://www.example.com/, apex is NOT a match
      assert.strictEqual(apexProp.isMatch, false)
      assert.strictEqual(apexProp.isSelectable, false)
      assert.strictEqual(wwwProp.isMatch, true)
      assert.strictEqual(wwwProp.isSelectable, true)
    })

    // 19. missing scan -> rejection
    it('19. missing scan is rejected with 404', async () => {
      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () => null,
      })
      assert.strictEqual(response.status, 404)
    })

    // 20. invalid access key -> rejection
    it('20. invalid access key is rejected with 403', async () => {
      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: 'wrong-key',
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () => createMockScan() as never,
        verifyReportAccessToken: () => false,
      })
      assert.strictEqual(response.status, 403)
    })

    // 21. non-Deep scan -> rejection
    it('21. non-Deep scan is rejected with 400', async () => {
      const quickScan = createMockScan({ plan: 'quick' })
      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () => quickScan as never,
        verifyReportAccessToken: () => true,
      })
      assert.strictEqual(response.status, 400)
      const data = await response.json()
      assert.match(data.error, /Deep Investigation/)
    })

    // 22. no Google connection -> rejection
    it('22. no Google connection is rejected with 400', async () => {
      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () => createMockScan() as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () => null,
      })
      assert.strictEqual(response.status, 400)
      const data = await response.json()
      assert.match(data.error, /not connected/)
    })

    // 23. selected property not returned by Google -> rejection
    it('23. selected property not returned by Google is rejected with 400', async () => {
      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:unauthorized.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () => createMockScan() as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
        decryptToken: () => 'test-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
        ],
      })
      assert.strictEqual(response.status, 400)
      const data = await response.json()
      assert.match(data.error, /not found in the connected Google/)
    })

    // 24. returned property that does not match target -> rejection
    it('24. returned property that does not match target is rejected with 400', async () => {
      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:other-domain.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () => createMockScan({ website_url: 'https://example.com/' }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
        decryptToken: () => 'test-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:other-domain.com', permissionLevel: 'siteOwner' },
        ],
      })
      assert.strictEqual(response.status, 400)
      const data = await response.json()
      assert.match(data.error, /does not match the website analyzed/)
    })

    // 25. siteUnverifiedUser -> rejection
    it('25. siteUnverifiedUser permission level is rejected with 400', async () => {
      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () => createMockScan({ website_url: 'https://example.com/' }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
        decryptToken: () => 'test-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteUnverifiedUser' },
        ],
      })
      assert.strictEqual(response.status, 400)
      const data = await response.json()
      assert.match(data.error, /unverified/)
    })

    // 26. valid matching property -> persisted exactly as Google returned it
    it('26. valid matching property is persisted exactly as Google returned it', async () => {
      let savedScanId: string | null = null
      let savedProperty: string | null = null

      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () =>
          createMockScan({ website_url: 'https://www.example.com/' }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
        decryptToken: () => 'test-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
        ],
        saveScanSearchConsoleProperty: async (id: string, prop: string) => {
          savedScanId = id
          savedProperty = prop
          return { success: true, modified: true }
        },
      })

      assert.strictEqual(response.status, 200)
      const data = await response.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.property, 'sc-domain:example.com')
      assert.strictEqual(savedScanId, TEST_SCAN_ID)
      assert.strictEqual(savedProperty, 'sc-domain:example.com')
    })

    // 27-29. SECRET SAFETY
    it('27-29. properties GET and POST responses never contain tokens, secrets, or encryption keys', async () => {
      const secretToken = 'secret-refresh-token-xyz-123'
      const encryptedSecret = encryptToken(secretToken, TEST_CONFIG.tokenEncryptionKey)

      const reqGet = new Request(
        `https://www.locitra.com/api/technical-seo/google/properties?scanId=${TEST_SCAN_ID}&key=${TEST_ACCESS_KEY}`
      )

      const resGet = await handleGooglePropertiesGet(reqGet, {
        getScanRecord: async () => createMockScan() as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () =>
          createMockConnection({ encryptedRefreshToken: encryptedSecret }) as never,
        decryptToken: () => secretToken,
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
        ],
      })

      const getText = await resGet.text()
      assert.strictEqual(getText.includes(secretToken), false, 'GET must not contain plain token')
      assert.strictEqual(
        getText.includes(encryptedSecret),
        false,
        'GET must not contain encrypted token'
      )
      assert.strictEqual(
        getText.includes(TEST_CONFIG.tokenEncryptionKey),
        false,
        'GET must not contain encryption key'
      )
      assert.strictEqual(
        getText.includes(TEST_CONFIG.clientSecret),
        false,
        'GET must not contain client secret'
      )

      const reqPost = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const resPost = await handleGooglePropertiesPost(reqPost, {
        getScanRecord: async () => createMockScan() as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () =>
          createMockConnection({ encryptedRefreshToken: encryptedSecret }) as never,
        decryptToken: () => secretToken,
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
        ],
        saveScanSearchConsoleProperty: async () => ({ success: true, modified: true }),
      })

      const postText = await resPost.text()
      assert.strictEqual(postText.includes(secretToken), false, 'POST must not contain plain token')
      assert.strictEqual(
        postText.includes(encryptedSecret),
        false,
        'POST must not contain encrypted token'
      )
      assert.strictEqual(
        postText.includes(TEST_CONFIG.tokenEncryptionKey),
        false,
        'POST must not contain encryption key'
      )
      assert.strictEqual(
        postText.includes(TEST_CONFIG.clientSecret),
        false,
        'POST must not contain client secret'
      )
    })
  })

  describe('Phase Deep-01 — Property Confirmation Persistence & State Transition', () => {
    it('exact validated property is persisted unchanged to gsc_property', async () => {
      let executedQuery = ''
      const executedParams: unknown[] = []

      const mockSql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
        executedQuery = strings.join('?')
        executedParams.push(...values)
        return Promise.resolve([])
      }) as unknown as typeof import('./db').sql

      const targetProperty = 'sc-domain:example.com'
      await saveScanSearchConsoleProperty(TEST_SCAN_ID, targetProperty, mockSql)

      assert.ok(executedQuery.includes('gsc_property = ?'))
      assert.ok(executedQuery.includes("when status = 'awaiting_gsc' then 'awaiting_payment'"))
      assert.strictEqual(executedParams[0], targetProperty)
      assert.strictEqual(executedParams[1], TEST_SCAN_ID)
    })

    it('awaiting_gsc status transitions to awaiting_payment when property is confirmed', async () => {
      let scanStatus = 'awaiting_gsc'
      let savedProperty: string | null = null

      const mockSql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
        const query = strings.join('?')
        if (query.includes("when status = 'awaiting_gsc' then 'awaiting_payment'")) {
          savedProperty = values[0] as string
          if (scanStatus === 'awaiting_gsc') {
            scanStatus = 'awaiting_payment'
          }
        }
        return Promise.resolve([])
      }) as unknown as typeof import('./db').sql

      await saveScanSearchConsoleProperty(TEST_SCAN_ID, 'sc-domain:locitra.com', mockSql)

      assert.strictEqual(savedProperty, 'sc-domain:locitra.com')
      assert.strictEqual(scanStatus, 'awaiting_payment')
    })

    it('existing non-awaiting_gsc status is not overwritten on property confirmation', async () => {
      const nonAwaitingGscStatuses = ['queued', 'running', 'analyzing', 'complete', 'failed']

      for (const initialStatus of nonAwaitingGscStatuses) {
        let scanStatus = initialStatus
        let savedProperty: string | null = null

        const mockSql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
          const query = strings.join('?')
          if (query.includes("when status = 'awaiting_gsc' then 'awaiting_payment'")) {
            savedProperty = values[0] as string
            if (scanStatus === 'awaiting_gsc') {
              scanStatus = 'awaiting_payment'
            }
          }
          return Promise.resolve([])
        }) as unknown as typeof import('./db').sql

        await saveScanSearchConsoleProperty(TEST_SCAN_ID, 'https://example.com/', mockSql)

        assert.strictEqual(savedProperty, 'https://example.com/')
        assert.strictEqual(
          scanStatus,
          initialStatus,
          `Status ${initialStatus} must not be overwritten`
        )
      }
    })
  })

  describe('Phase Deep-01 Remediation — GSC Property Locking & State Transitions', () => {
    it('A. awaiting_gsc + new property -> saves property + transitions to awaiting_payment', async () => {
      let savedProperty: string | null = null
      let savedScanId: string | null = null

      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () =>
          createMockScan({
            status: 'awaiting_gsc',
            website_url: 'https://example.com/',
          }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () =>
          createMockConnection({ property: null }) as never,
        decryptToken: () => 'test-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
        ],
        saveScanSearchConsoleProperty: async (id: string, prop: string) => {
          savedScanId = id
          savedProperty = prop
          return { success: true, modified: true }
        },
      })

      assert.strictEqual(response.status, 200)
      const data = await response.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.property, 'sc-domain:example.com')
      assert.strictEqual(savedScanId, TEST_SCAN_ID)
      assert.strictEqual(savedProperty, 'sc-domain:example.com')
    })

    it('B. awaiting_payment + same property -> idempotent success, status unchanged', async () => {
      let saveCalled = false

      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () =>
          createMockScan({
            status: 'awaiting_payment',
            website_url: 'https://example.com/',
          }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () =>
          createMockConnection({ property: 'sc-domain:example.com' }) as never,
        saveScanSearchConsoleProperty: async () => {
          saveCalled = true
          return { success: true, modified: false }
        },
      })

      assert.strictEqual(response.status, 200)
      const data = await response.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.property, 'sc-domain:example.com')
      assert.strictEqual(
        saveCalled,
        false,
        'Should not re-invoke save on already-confirmed property'
      )
    })

    it('C. awaiting_payment + different property -> rejected', async () => {
      let saveCalled = false

      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:different.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () =>
          createMockScan({
            status: 'awaiting_payment',
            website_url: 'https://example.com/',
          }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () =>
          createMockConnection({ property: 'sc-domain:example.com' }) as never,
        saveScanSearchConsoleProperty: async () => {
          saveCalled = true
          return { success: true, modified: false }
        },
      })

      assert.strictEqual(response.status, 409)
      const data = await response.json()
      assert.ok(data.error.includes('cannot be changed'))
      assert.strictEqual(saveCalled, false)
    })

    it('D. queued/complete/etc + same property -> no mutation', async () => {
      const nonAwaitingStatuses = [
        'queued',
        'running',
        'analyzing',
        'complete',
        'failed',
        'cancelled',
      ]

      for (const status of nonAwaitingStatuses) {
        let saveCalled = false

        const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanId: TEST_SCAN_ID,
            key: TEST_ACCESS_KEY,
            property: 'sc-domain:example.com',
          }),
        })

        const response = await handleGooglePropertiesPost(req, {
          getScanRecord: async () =>
            createMockScan({
              status,
              website_url: 'https://example.com/',
            }) as never,
          verifyReportAccessToken: () => true,
          getGoogleSearchConsoleConnection: async () =>
            createMockConnection({ property: 'sc-domain:example.com' }) as never,
          saveScanSearchConsoleProperty: async () => {
            saveCalled = true
            return { success: true, modified: false }
          },
        })

        assert.strictEqual(response.status, 200)
        const data = await response.json()
        assert.strictEqual(data.success, true)
        assert.strictEqual(data.property, 'sc-domain:example.com')
        assert.strictEqual(saveCalled, false, `Must not mutate when scan status is ${status}`)
      }
    })

    it('E. queued/complete/etc + different property -> rejected', async () => {
      const nonAwaitingStatuses = [
        'queued',
        'running',
        'analyzing',
        'complete',
        'failed',
        'cancelled',
      ]

      for (const status of nonAwaitingStatuses) {
        let saveCalled = false

        const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanId: TEST_SCAN_ID,
            key: TEST_ACCESS_KEY,
            property: 'sc-domain:malicious-overwrite.com',
          }),
        })

        const response = await handleGooglePropertiesPost(req, {
          getScanRecord: async () =>
            createMockScan({
              status,
              website_url: 'https://example.com/',
            }) as never,
          verifyReportAccessToken: () => true,
          getGoogleSearchConsoleConnection: async () =>
            createMockConnection({ property: 'sc-domain:example.com' }) as never,
          saveScanSearchConsoleProperty: async () => {
            saveCalled = true
            return { success: true, modified: false }
          },
        })

        assert.strictEqual(
          response.status,
          409,
          `Must reject overwrite when scan status is ${status}`
        )
        const data = await response.json()
        assert.ok(data.error.includes('cannot be changed'))
        assert.strictEqual(saveCalled, false)
      }
    })

    it('F. concurrency race: losing request with simulated modified=false is rejected with 409', async () => {
      let saveCalled = false

      const req = new Request('https://www.locitra.com/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: TEST_SCAN_ID,
          key: TEST_ACCESS_KEY,
          property: 'sc-domain:example.com',
        }),
      })

      const response = await handleGooglePropertiesPost(req, {
        getScanRecord: async () =>
          createMockScan({
            status: 'awaiting_gsc',
            website_url: 'https://example.com/',
          }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () =>
          createMockConnection({ property: null }) as never,
        decryptToken: () => 'test-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
        ],
        saveScanSearchConsoleProperty: async () => {
          saveCalled = true
          return { success: true, modified: false }
        },
      })

      assert.strictEqual(saveCalled, true, 'Handler must call saveScanSearchConsoleProperty')
      assert.strictEqual(
        response.status,
        409,
        'Must return HTTP 409 when repository reports modified=false'
      )
      const data = await response.json()
      assert.strictEqual(data.success, undefined, 'No success flag allowed on conflict')
      assert.strictEqual(data.property, undefined, 'No confirmed property allowed on conflict')
      assert.ok(data.error, 'Must provide a safe conflict message')
    })

    it('repository boundary: where clause enforces property lock on seo_scans update', async () => {
      let executedQuery = ''
      const executedParams: unknown[] = []

      const mockSql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
        executedQuery = strings.join('?')
        executedParams.push(...values)
        return Promise.resolve([])
      }) as unknown as typeof import('./db').sql

      const res = await saveScanSearchConsoleProperty(
        TEST_SCAN_ID,
        'sc-domain:example.com',
        mockSql
      )

      assert.ok(
        /\(\s*\(status = 'awaiting_gsc' and gsc_property is null\)\s+or gsc_property = \?\s*\)/.test(
          executedQuery
        ),
        'Database update must enforce status=awaiting_gsc when gsc_property is null and guard against overwriting'
      )
      assert.strictEqual(executedParams[2], 'sc-domain:example.com')
      assert.strictEqual(res.success, true)
      assert.strictEqual(res.modified, false, 'Should return modified=false when 0 rows returned')
    })

    it('repository boundary: returns modified=true when row is updated', async () => {
      const mockSql = ((_strings: TemplateStringsArray, ..._values: unknown[]) => {
        return Promise.resolve([
          { id: TEST_SCAN_ID, status: 'awaiting_payment', gsc_property: 'sc-domain:example.com' },
        ])
      }) as unknown as typeof import('./db').sql

      const res = await saveScanSearchConsoleProperty(
        TEST_SCAN_ID,
        'sc-domain:example.com',
        mockSql
      )
      assert.strictEqual(res.success, true)
      assert.strictEqual(res.modified, true)
    })

    it('http boundary: verifies HTTP handler checks repository modified flag', async () => {
      const createReq = () =>
        new Request('https://www.locitra.com/api/technical-seo/google/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanId: TEST_SCAN_ID,
            key: TEST_ACCESS_KEY,
            property: 'sc-domain:example.com',
          }),
        })

      // 1. When repository returns modified=false, handler checks it and returns 409
      const responseConflict = await handleGooglePropertiesPost(createReq(), {
        getScanRecord: async () =>
          createMockScan({ status: 'awaiting_gsc', website_url: 'https://example.com/' }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () =>
          createMockConnection({ property: null }) as never,
        decryptToken: () => 'test-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
        ],
        saveScanSearchConsoleProperty: async () => ({ success: true, modified: false }),
      })
      assert.strictEqual(
        responseConflict.status,
        409,
        'Handler must check modified=false and return 409'
      )
      const conflictBody = await responseConflict.json()
      assert.strictEqual(conflictBody.success, undefined)
      assert.ok(conflictBody.error)

      // 2. When repository returns modified=true, handler checks it and returns 200
      const responseSuccess = await handleGooglePropertiesPost(createReq(), {
        getScanRecord: async () =>
          createMockScan({ status: 'awaiting_gsc', website_url: 'https://example.com/' }) as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () =>
          createMockConnection({ property: null }) as never,
        decryptToken: () => 'test-token',
        listSearchConsoleProperties: async () => [
          { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
        ],
        saveScanSearchConsoleProperty: async () => ({ success: true, modified: true }),
      })
      assert.strictEqual(
        responseSuccess.status,
        200,
        'Handler must check modified=true and return 200'
      )
      const successBody = await responseSuccess.json()
      assert.strictEqual(successBody.success, true)
      assert.strictEqual(successBody.property, 'sc-domain:example.com')
    })
  })
})
