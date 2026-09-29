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
} = require('./google-search-console')
const { handleGoogleConnect } = require('../../app/api/technical-seo/google/connect/route')
const { handleGoogleCallback } = require('../../app/api/technical-seo/google/callback/route')
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
