import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  discoverSitemapPages,
  fetchRobotsContent,
  fetchText,
  loadRobotsPolicy,
} from './site-discovery'
import { assertSafeHostname, type DnsResolver } from './scanner'

function createMockResolver(
  recordsMap: Record<string, Array<{ address: string; family: number }>>
): DnsResolver {
  return {
    lookup: async (hostname: string) => {
      const records = recordsMap[hostname.toLowerCase()]
      if (!records) {
        throw new Error(`getaddrinfo ENOTFOUND ${hostname}`)
      }
      return records
    },
  }
}

describe('Site Discovery SSRF Defense-in-Depth', () => {
  describe('Canonical assertSafeHostname Unit Verification', () => {
    const publicResolver = createMockResolver({
      'public.example.com': [
        { address: '93.184.215.14', family: 4 },
        { address: '2606:4700:9ad5::1', family: 6 },
      ],
      'safe-blog.org': [{ address: '104.21.5.12', family: 4 }],
    })

    it('A: Public HTTPS hostname is allowed', async () => {
      await assert.doesNotReject(async () => {
        await assertSafeHostname('public.example.com', publicResolver)
      })
      await assert.doesNotReject(async () => {
        await assertSafeHostname('safe-blog.org', publicResolver)
      })
    })

    it('B: localhost is blocked', async () => {
      await assert.rejects(async () => {
        await assertSafeHostname('localhost', publicResolver)
      }, /Local and private network targets are not allowed/)

      await assert.rejects(async () => {
        await assertSafeHostname('app.localhost', publicResolver)
      }, /Local and private network targets are not allowed/)

      await assert.rejects(async () => {
        await assertSafeHostname('localhost.localdomain', publicResolver)
      }, /Local and private network targets are not allowed/)

      await assert.rejects(async () => {
        await assertSafeHostname('0.0.0.0', publicResolver)
      }, /Local and private network targets are not allowed/)
    })

    it('C: 127.0.0.1 is blocked', async () => {
      await assert.rejects(async () => {
        await assertSafeHostname('127.0.0.1', publicResolver)
      }, /Local and private network targets are not allowed/)

      await assert.rejects(async () => {
        await assertSafeHostname('127.0.0.2', publicResolver)
      }, /Private network targets are not allowed/)
    })

    it('D: private IPv4 addresses are blocked', async () => {
      const privateIps = [
        '10.0.0.1',
        '10.254.1.5',
        '172.16.0.1',
        '172.24.10.20',
        '172.31.255.255',
        '192.168.0.1',
        '192.168.1.100',
      ]

      for (const ip of privateIps) {
        await assert.rejects(
          async () => {
            await assertSafeHostname(ip, publicResolver)
          },
          /Private network targets are not allowed/,
          `IP ${ip} must be blocked`
        )
      }
    })

    it('E: link-local addresses are blocked', async () => {
      await assert.rejects(async () => {
        await assertSafeHostname('169.254.169.254', publicResolver)
      }, /Private network targets are not allowed/)

      await assert.rejects(async () => {
        await assertSafeHostname('169.254.1.1', publicResolver)
      }, /Private network targets are not allowed/)
    })

    it('F: private IPv6 addresses are blocked', async () => {
      // Loopback
      await assert.rejects(async () => {
        await assertSafeHostname('::1', publicResolver)
      }, /Local and private network targets are not allowed/)
      await assert.rejects(async () => {
        await assertSafeHostname('[::1]', publicResolver)
      }, /Local and private network targets are not allowed/)

      // Unique Local Addresses (fc00::/7)
      await assert.rejects(async () => {
        await assertSafeHostname('fc00::1', publicResolver)
      }, /Private network targets are not allowed/)
      await assert.rejects(async () => {
        await assertSafeHostname('[fc00::1]', publicResolver)
      }, /Private network targets are not allowed/)
      await assert.rejects(async () => {
        await assertSafeHostname('fd12:3456:789a::1', publicResolver)
      }, /Private network targets are not allowed/)

      // Link-local IPv6 (fe80::/10)
      await assert.rejects(async () => {
        await assertSafeHostname('fe80::1', publicResolver)
      }, /Private network targets are not allowed/)
    })

    it('G: DNS hostname resolving to a private address is blocked', async () => {
      const privateResolver = createMockResolver({
        'corp.internal': [{ address: '10.10.10.10', family: 4 }],
        'home.router': [{ address: '192.168.1.1', family: 4 }],
        'meta.aws': [{ address: '169.254.169.254', family: 4 }],
        'docker.host': [{ address: '172.17.0.2', family: 4 }],
        'ipv6.internal': [{ address: 'fd00::dead:beef', family: 6 }],
        'loopback.domain': [{ address: '127.0.0.1', family: 4 }],
        'mixed.domain': [
          { address: '93.184.215.14', family: 4 },
          { address: '10.0.0.1', family: 4 },
        ],
      })

      const testDomains = [
        'corp.internal',
        'home.router',
        'meta.aws',
        'docker.host',
        'ipv6.internal',
        'loopback.domain',
        'mixed.domain',
      ]

      for (const domain of testDomains) {
        await assert.rejects(
          async () => {
            await assertSafeHostname(domain, privateResolver)
          },
          /The target resolves to a private network address/,
          `Domain ${domain} resolving to private IP must be blocked`
        )
      }
    })
  })

  describe('fetchRobotsContent SSRF Defense', () => {
    it('blocks localhost without making network calls', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('User-agent: *', { status: 200 })
      }

      const result = await fetchRobotsContent(new URL('http://localhost/robots.txt'), {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false, 'fetch must NOT be called for localhost')
      assert.strictEqual(result.kind, 'error')
    })

    it('blocks private IPv4 without making network calls', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('User-agent: *', { status: 200 })
      }

      const result = await fetchRobotsContent(new URL('http://192.168.1.1/robots.txt'), {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false, 'fetch must NOT be called for 192.168.1.1')
      assert.strictEqual(result.kind, 'error')
    })

    it('blocks cloud metadata endpoint 169.254.169.254 without making network calls', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('AMI data', { status: 200 })
      }

      const result = await fetchRobotsContent(new URL('http://169.254.169.254/robots.txt'), {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false, 'fetch must NOT be called for 169.254.169.254')
      assert.strictEqual(result.kind, 'error')
    })

    it('blocks DNS rebinding to private IP via custom assertSafeHostname without making network calls', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('User-agent: *', { status: 200 })
      }

      const mockAssertSafe = async () => {
        throw new Error('The target resolves to a private network address.')
      }

      const result = await fetchRobotsContent(new URL('https://evil-rebind.com/robots.txt'), {
        assertSafeHostname: mockAssertSafe,
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false, 'fetch must NOT be called for private rebind')
      assert.strictEqual(result.kind, 'error')
    })

    it('allows legitimate public URL and processes robots.txt', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async (input) => {
        fetchCalled = true
        assert.strictEqual(input.toString(), 'https://public.example.com/robots.txt')
        return new Response('User-agent: *\nDisallow: /admin\n', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        })
      }

      const result = await fetchRobotsContent(new URL('https://public.example.com/robots.txt'), {
        assertSafeHostname: async () => {},
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, true)
      assert.strictEqual(result.kind, 'success')
      if (result.kind === 'success') {
        assert.match(result.text, /Disallow: \/admin/)
      }
    })
  })

  describe('fetchText SSRF Defense', () => {
    it('blocks 127.0.0.1 without calling fetch', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('<xml/>', { status: 200 })
      }

      const result = await fetchText(new URL('http://127.0.0.1/sitemap.xml'), {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false)
      assert.strictEqual(result, null)
    })

    it('blocks private IPv6 [::1] without calling fetch', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('<xml/>', { status: 200 })
      }

      const result = await fetchText(new URL('http://[::1]/sitemap.xml'), {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false)
      assert.strictEqual(result, null)
    })

    it('allows legitimate public URL and returns content', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('<urlset><url><loc>https://public.example.com/</loc></url></urlset>', {
          status: 200,
          headers: { 'content-type': 'application/xml' },
        })
      }

      const result = await fetchText(new URL('https://public.example.com/sitemap.xml'), {
        assertSafeHostname: async () => {},
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, true)
      assert.match(result ?? '', /<urlset>/)
    })
  })

  describe('loadRobotsPolicy SSRF Integration', () => {
    it('returns loaded=false for localhost and makes zero network requests', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('User-agent: *', { status: 200 })
      }

      const policy = await loadRobotsPolicy('http://localhost/', {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false)
      assert.strictEqual(policy.loaded, false)
      assert.strictEqual(policy.rules.length, 0)
    })

    it('returns loaded=false for 169.254.169.254 and makes zero network requests', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('User-agent: *', { status: 200 })
      }

      const policy = await loadRobotsPolicy('http://169.254.169.254/', {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false)
      assert.strictEqual(policy.loaded, false)
      assert.strictEqual(policy.rules.length, 0)
    })

    it('parses robots policy safely for legitimate public site with mock fetch', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response('User-agent: *\nDisallow: /secret\nAllow: /public\n', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        })
      }

      const policy = await loadRobotsPolicy('https://public.example.com/', {
        assertSafeHostname: async () => {},
        fetch: mockFetch,
      })

      assert.strictEqual(policy.loaded, true)
      assert.strictEqual(policy.rules.length, 2)
      assert.strictEqual(policy.rules[0].pattern, '/secret')
      assert.strictEqual(policy.rules[0].allow, false)
      assert.strictEqual(policy.rules[1].pattern, '/public')
      assert.strictEqual(policy.rules[1].allow, true)
    })
  })

  describe('discoverSitemapPages SSRF Integration & Sitemap Discovery', () => {
    it('blocks localhost target and makes zero network requests', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('<urlset></urlset>', { status: 200 })
      }

      const pages = await discoverSitemapPages('http://localhost/', 10, {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false)
      assert.deepStrictEqual(pages, [])
    })

    it('blocks 10.0.0.1 target and makes zero network requests', async () => {
      let fetchCalled = false
      const mockFetch: typeof fetch = async () => {
        fetchCalled = true
        return new Response('<urlset></urlset>', { status: 200 })
      }

      const pages = await discoverSitemapPages('http://10.0.0.1/', 10, {
        fetch: mockFetch,
      })

      assert.strictEqual(fetchCalled, false)
      assert.deepStrictEqual(pages, [])
    })

    it('H: Legitimate sitemap/robots URL works with mocked network layer', async () => {
      const responses: Record<string, string> = {
        'https://public.example.com/robots.txt':
          'User-agent: *\nDisallow: /admin\nSitemap: https://public.example.com/custom-sitemap.xml\n',
        'https://public.example.com/custom-sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://public.example.com/page-1</loc></url>
            <url><loc>https://public.example.com/page-2</loc></url>
            <url><loc>https://public.example.com/page-3</loc></url>
          </urlset>`,
        'https://public.example.com/sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://public.example.com/page-1</loc></url>
          </urlset>`,
        'https://public.example.com/sitemap_index.xml': `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          </urlset>`,
      }

      const fetchedUrls: string[] = []
      const mockFetch: typeof fetch = async (input) => {
        const url = input.toString()
        fetchedUrls.push(url)
        const body = responses[url]
        if (!body) {
          return new Response('Not Found', { status: 404 })
        }
        return new Response(body, {
          status: 200,
          headers: { 'content-type': 'application/xml' },
        })
      }

      const pages = await discoverSitemapPages('https://public.example.com/', 5, {
        assertSafeHostname: async () => {},
        fetch: mockFetch,
      })

      assert.deepStrictEqual(
        pages.sort(),
        [
          'https://public.example.com/page-1',
          'https://public.example.com/page-2',
          'https://public.example.com/page-3',
        ].sort()
      )
      assert.strictEqual(fetchedUrls.includes('https://public.example.com/robots.txt'), true)
    })
  })
})
