import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildArchitectureSummary,
  buildDuplicateCandidateSummary,
  getPathSection,
  runCrawl,
} from './crawler'
import type { ScanResult } from './types'

function createMockScan(overrides: Partial<ScanResult>): ScanResult {
  return {
    scanId: 'test-scan-id',
    url: overrides.url ?? 'https://example.com/page',
    finalUrl: overrides.finalUrl ?? overrides.url ?? 'https://example.com/page',
    fetchedAt: '2026-09-25T12:00:00.000Z',
    httpStatus: overrides.httpStatus ?? 200,
    contentType: 'text/html',
    durationMs: 150,
    pagesChecked: 1,
    internalUrlsDiscovered: 0,
    discoveredInternalUrls: overrides.discoveredInternalUrls ?? [],
    pageTitle: overrides.pageTitle !== undefined ? overrides.pageTitle : 'Sample Page Title',
    metaDescription:
      overrides.metaDescription !== undefined
        ? overrides.metaDescription
        : 'Sample page description text.',
    canonical: overrides.canonical !== undefined ? overrides.canonical : null,
    robotsMeta: null,
    robotsTxt: {
      status: 200,
      found: true,
      disallowsRoot: false,
      sitemapUrls: [],
    },
    sitemap: {
      url: null,
      status: null,
      found: false,
    },
    metrics: {
      internalLinks: 5,
      externalLinks: 1,
      images: 2,
      imagesWithoutAlt: 0,
      imagesWithEmptyAlt: 0,
      imagesWithoutDimensions: 0,
      h1Count: 1,
      jsonLdBlocks: 1,
      jsonLdTypes: ['Article'],
      hreflangCount: 0,
      hasViewport: true,
      mixedContentCount: 0,
    },
    summary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    },
    findings: [],
    ...overrides,
  }
}

describe('getPathSection', () => {
  it('returns "/" for root URLs with or without trailing slashes', () => {
    assert.strictEqual(getPathSection('https://example.com'), '/')
    assert.strictEqual(getPathSection('https://example.com/'), '/')
  })

  it('extracts first path segment with leading and trailing slashes', () => {
    assert.strictEqual(getPathSection('https://example.com/blog/'), '/blog/')
    assert.strictEqual(getPathSection('https://example.com/blog/my-post-title'), '/blog/')
    assert.strictEqual(getPathSection('https://example.com/products/item-42/specs'), '/products/')
  })

  it('handles query parameters and URL hashes cleanly', () => {
    assert.strictEqual(
      getPathSection('https://example.com/tools/audit?view=full#pricing'),
      '/tools/'
    )
  })

  it('falls back to "/" for invalid URL strings', () => {
    assert.strictEqual(getPathSection('not-a-valid-url'), '/')
    assert.strictEqual(getPathSection(''), '/')
  })
})

describe('buildArchitectureSummary', () => {
  it('computes depth distribution and max depth from page depth map', () => {
    const pageResults = [
      createMockScan({ url: 'https://example.com/', finalUrl: 'https://example.com/' }),
      createMockScan({ url: 'https://example.com/blog', finalUrl: 'https://example.com/blog/' }),
      createMockScan({
        url: 'https://example.com/blog/post-1',
        finalUrl: 'https://example.com/blog/post-1',
      }),
      createMockScan({
        url: 'https://example.com/blog/post-2',
        finalUrl: 'https://example.com/blog/post-2',
      }),
    ]

    const pageDepthMap = new Map<string, number>([
      ['https://example.com/', 0],
      ['https://example.com/blog/', 1],
      ['https://example.com/blog/post-1', 2],
      ['https://example.com/blog/post-2', 2],
    ])

    const summary = buildArchitectureSummary({
      pageResults,
      pageDepthMap,
      internalInboundGraph: new Map(),
      sitemapDiscoveredUrls: new Set(),
      rootUrl: 'https://example.com/',
      canonicalRootUrl: 'https://example.com/',
    })

    assert.deepStrictEqual(summary.depthDistribution, { 0: 1, 1: 1, 2: 2 })
    assert.strictEqual(summary.maxDepth, 2)
  })

  it('excludes unknown or null depth pages from depthDistribution and maxDepth', () => {
    const pageResults = [
      createMockScan({ url: 'https://example.com/', finalUrl: 'https://example.com/' }),
      createMockScan({ url: 'https://example.com/known', finalUrl: 'https://example.com/known' }),
      createMockScan({
        url: 'https://example.com/unknown',
        finalUrl: 'https://example.com/unknown',
      }),
    ]

    const pageDepthMap = new Map<string, number | null>([
      ['https://example.com/', 0],
      ['https://example.com/known', 1],
      ['https://example.com/unknown', null],
    ])

    const summary = buildArchitectureSummary({
      pageResults,
      pageDepthMap,
      internalInboundGraph: new Map(),
      sitemapDiscoveredUrls: new Set(),
      rootUrl: 'https://example.com/',
      canonicalRootUrl: 'https://example.com/',
    })

    assert.deepStrictEqual(summary.depthDistribution, { 0: 1, 1: 1 })
    assert.strictEqual(summary.maxDepth, 1)
  })

  it('ranks top linked internal URLs by inbound count descending', () => {
    const internalInboundGraph = new Map<string, Set<string>>([
      ['https://example.com/about', new Set(['https://example.com/', 'https://example.com/blog/'])],
      ['https://example.com/pricing', new Set(['https://example.com/'])],
      [
        'https://example.com/contact',
        new Set(['https://example.com/', 'https://example.com/about', 'https://example.com/blog/']),
      ],
      ['https://example.com/unlinked', new Set()],
    ])

    const summary = buildArchitectureSummary({
      pageResults: [],
      pageDepthMap: new Map(),
      internalInboundGraph,
      sitemapDiscoveredUrls: new Set(),
      rootUrl: 'https://example.com/',
      canonicalRootUrl: 'https://example.com/',
    })

    assert.strictEqual(summary.topLinkedUrls.length, 3)
    assert.strictEqual(summary.topLinkedUrls[0].url, 'https://example.com/contact')
    assert.strictEqual(summary.topLinkedUrls[0].inboundCount, 3)
    assert.strictEqual(summary.topLinkedUrls[1].url, 'https://example.com/about')
    assert.strictEqual(summary.topLinkedUrls[1].inboundCount, 2)
    assert.strictEqual(summary.topLinkedUrls[2].url, 'https://example.com/pricing')
    assert.strictEqual(summary.topLinkedUrls[2].inboundCount, 1)
  })

  it('aggregates section distribution sorted by page count descending', () => {
    const pageResults = [
      createMockScan({ url: 'https://example.com/', finalUrl: 'https://example.com/' }),
      createMockScan({
        url: 'https://example.com/blog/1',
        finalUrl: 'https://example.com/blog/1',
      }),
      createMockScan({
        url: 'https://example.com/blog/2',
        finalUrl: 'https://example.com/blog/2',
      }),
      createMockScan({
        url: 'https://example.com/docs/intro',
        finalUrl: 'https://example.com/docs/intro',
      }),
    ]

    const summary = buildArchitectureSummary({
      pageResults,
      pageDepthMap: new Map(),
      internalInboundGraph: new Map(),
      sitemapDiscoveredUrls: new Set(),
      rootUrl: 'https://example.com/',
      canonicalRootUrl: 'https://example.com/',
    })

    assert.deepStrictEqual(summary.sectionDistribution, [
      { path: '/blog/', pageCount: 2 },
      { path: '/', pageCount: 1 },
      { path: '/docs/', pageCount: 1 },
    ])
  })

  it('evaluates self, cross-page, and missing canonicals accurately', () => {
    const pageResults = [
      createMockScan({
        finalUrl: 'https://example.com/blog/post-1',
        canonical: 'https://example.com/blog/post-1',
      }),
      createMockScan({
        finalUrl: 'https://example.com/blog/post-duplicate',
        canonical: 'https://example.com/blog/post-1',
      }),
      createMockScan({
        finalUrl: 'https://example.com/blog/post-3',
        canonical: null,
      }),
      createMockScan({
        finalUrl: 'https://example.com/blog/post-4',
        canonical: 'https://external-domain.com/article',
      }),
    ]

    const summary = buildArchitectureSummary({
      pageResults,
      pageDepthMap: new Map(),
      internalInboundGraph: new Map(),
      sitemapDiscoveredUrls: new Set(),
      rootUrl: 'https://example.com/',
      canonicalRootUrl: 'https://example.com/',
    })

    assert.strictEqual(summary.canonicalSummary.selfCanonicalCount, 1)
    assert.strictEqual(summary.canonicalSummary.crossPageCanonicalCount, 1)
    assert.strictEqual(summary.canonicalSummary.missingCanonicalCount, 1)
  })

  describe('sitemap orphan candidate normalization across redirects', () => {
    it('identifies unlinked sitemap pages as orphan candidates', () => {
      const summary = buildArchitectureSummary({
        pageResults: [],
        pageDepthMap: new Map(),
        internalInboundGraph: new Map([
          ['https://example.com/linked', new Set(['https://example.com/'])],
        ]),
        sitemapDiscoveredUrls: new Set([
          'https://example.com/orphan-1',
          'https://example.com/linked',
          'https://example.com/orphan-2',
        ]),
        rootUrl: 'https://example.com/',
        canonicalRootUrl: 'https://example.com/',
      })

      assert.deepStrictEqual(summary.orphanCandidates, [
        'https://example.com/orphan-1',
        'https://example.com/orphan-2',
      ])
    })

    it('excludes root and canonicalRootUrl from orphan candidates', () => {
      const summary = buildArchitectureSummary({
        pageResults: [],
        pageDepthMap: new Map(),
        internalInboundGraph: new Map(),
        sitemapDiscoveredUrls: new Set([
          'https://example.com',
          'https://example.com/',
          'https://example.com/orphan',
        ]),
        rootUrl: 'https://example.com',
        canonicalRootUrl: 'https://example.com/',
      })

      assert.deepStrictEqual(summary.orphanCandidates, ['https://example.com/orphan'])
    })

    it('excludes sitemap URL when it redirects to a page with inbound links', () => {
      const pageResults = [
        createMockScan({
          url: 'https://example.com/old-about',
          finalUrl: 'https://example.com/about/',
        }),
      ]

      const internalInboundGraph = new Map<string, Set<string>>([
        ['https://example.com/about/', new Set(['https://example.com/'])],
      ])

      const summary = buildArchitectureSummary({
        pageResults,
        pageDepthMap: new Map(),
        internalInboundGraph,
        sitemapDiscoveredUrls: new Set(['https://example.com/old-about']),
        rootUrl: 'https://example.com/',
        canonicalRootUrl: 'https://example.com/',
      })

      assert.deepStrictEqual(summary.orphanCandidates, [])
    })

    it('excludes sitemap destination when internal links point to pre-redirect URL', () => {
      const pageResults = [
        createMockScan({
          url: 'https://example.com/legacy-guide',
          finalUrl: 'https://example.com/guides/modern',
        }),
      ]

      const internalInboundGraph = new Map<string, Set<string>>([
        ['https://example.com/legacy-guide', new Set(['https://example.com/blog/'])],
      ])

      const summary = buildArchitectureSummary({
        pageResults,
        pageDepthMap: new Map(),
        internalInboundGraph,
        sitemapDiscoveredUrls: new Set(['https://example.com/guides/modern']),
        rootUrl: 'https://example.com/',
        canonicalRootUrl: 'https://example.com/',
      })

      assert.deepStrictEqual(summary.orphanCandidates, [])
    })

    it('excludes sitemap URL that redirects to root or canonicalRootUrl', () => {
      const pageResults = [
        createMockScan({
          url: 'https://example.com/home',
          finalUrl: 'https://example.com/',
        }),
        createMockScan({
          url: 'https://example.com/index.html',
          finalUrl: 'https://example.com/',
        }),
      ]

      const summary = buildArchitectureSummary({
        pageResults,
        pageDepthMap: new Map(),
        internalInboundGraph: new Map(),
        sitemapDiscoveredUrls: new Set([
          'https://example.com/home',
          'https://example.com/index.html',
          'https://example.com/true-orphan',
        ]),
        rootUrl: 'https://example.com',
        canonicalRootUrl: 'https://example.com/',
      })

      assert.deepStrictEqual(summary.orphanCandidates, ['https://example.com/true-orphan'])
    })

    it('normalizes orphan candidate to destination URL and deduplicates across redirects', () => {
      const pageResults = [
        createMockScan({
          url: 'https://example.com/old-service',
          finalUrl: 'https://example.com/services/consulting',
        }),
        createMockScan({
          url: 'https://example.com/old-consulting',
          finalUrl: 'https://example.com/services/consulting',
        }),
      ]

      const summary = buildArchitectureSummary({
        pageResults,
        pageDepthMap: new Map(),
        internalInboundGraph: new Map(),
        sitemapDiscoveredUrls: new Set([
          'https://example.com/old-service',
          'https://example.com/old-consulting',
          'https://example.com/services/consulting',
        ]),
        rootUrl: 'https://example.com/',
        canonicalRootUrl: 'https://example.com/',
      })

      assert.deepStrictEqual(summary.orphanCandidates, ['https://example.com/services/consulting'])
    })
  })
})

describe('buildDuplicateCandidateSummary', () => {
  it('groups duplicate titles with whitespace normalization and minimum 2 URLs', () => {
    const pageResults = [
      createMockScan({
        finalUrl: 'https://example.com/page-1',
        pageTitle: 'Top SEO Tools  2026 ',
      }),
      createMockScan({
        finalUrl: 'https://example.com/page-2',
        pageTitle: 'Top SEO Tools 2026',
      }),
      createMockScan({
        finalUrl: 'https://example.com/unique',
        pageTitle: 'Unique Page Title',
      }),
      createMockScan({
        finalUrl: 'https://example.com/empty-title',
        pageTitle: '   ',
      }),
    ]

    const summary = buildDuplicateCandidateSummary({
      pageResults,
      discoveredUrls: new Set(),
      finalOrigin: 'https://example.com',
    })

    assert.strictEqual(summary.titleDuplicateGroups.length, 1)
    assert.strictEqual(summary.titleDuplicateGroups[0].title, 'Top SEO Tools 2026')
    assert.deepStrictEqual(summary.titleDuplicateGroups[0].urls, [
      'https://example.com/page-1',
      'https://example.com/page-2',
    ])
  })

  it('groups duplicate meta descriptions with minimum 2 URLs', () => {
    const pageResults = [
      createMockScan({
        finalUrl: 'https://example.com/product-a',
        metaDescription: 'Best digital software suite for modern marketing agencies.',
      }),
      createMockScan({
        finalUrl: 'https://example.com/product-b',
        metaDescription: 'Best digital software suite for modern marketing agencies.',
      }),
      createMockScan({
        finalUrl: 'https://example.com/product-c',
        metaDescription: 'Unique product description.',
      }),
    ]

    const summary = buildDuplicateCandidateSummary({
      pageResults,
      discoveredUrls: new Set(),
      finalOrigin: 'https://example.com',
    })

    assert.strictEqual(summary.descriptionDuplicateGroups.length, 1)
    assert.strictEqual(
      summary.descriptionDuplicateGroups[0].description,
      'Best digital software suite for modern marketing agencies.'
    )
    assert.strictEqual(summary.descriptionDuplicateGroups[0].urls.length, 2)
  })

  it('detects parameter variations for the same base URL while respecting target origin', () => {
    const discoveredUrls = new Set([
      'https://example.com/shop/shoes?color=blue',
      'https://example.com/shop/shoes?color=red&size=10',
      'https://example.com/shop/shoes',
      'https://example.com/about?ref=nav',
      'https://other-domain.com/shop/shoes?color=blue',
    ])

    const summary = buildDuplicateCandidateSummary({
      pageResults: [],
      discoveredUrls,
      finalOrigin: 'https://example.com',
    })

    assert.strictEqual(summary.parameterVariationGroups.length, 1)
    assert.strictEqual(
      summary.parameterVariationGroups[0].baseUrl,
      'https://example.com/shop/shoes'
    )
    assert.strictEqual(summary.parameterVariationGroups[0].variations.length, 3)
    assert(
      summary.parameterVariationGroups[0].variations.includes(
        'https://example.com/shop/shoes?color=blue'
      )
    )
    assert(
      summary.parameterVariationGroups[0].variations.includes(
        'https://example.com/shop/shoes?color=red&size=10'
      )
    )
  })

  it('detects canonical conflicts when multiple pages declare the same canonical target', () => {
    const pageResults = [
      createMockScan({
        finalUrl: 'https://example.com/shoes-men',
        canonical: 'https://example.com/shoes',
      }),
      createMockScan({
        finalUrl: 'https://example.com/shoes-sale',
        canonical: 'https://example.com/shoes',
      }),
      createMockScan({
        finalUrl: 'https://example.com/shoes',
        canonical: 'https://example.com/shoes',
      }),
    ]

    const summary = buildDuplicateCandidateSummary({
      pageResults,
      discoveredUrls: new Set(),
      finalOrigin: 'https://example.com',
    })

    assert.strictEqual(summary.canonicalConflictGroups.length, 1)
    assert.strictEqual(summary.canonicalConflictGroups[0].canonicalUrl, 'https://example.com/shoes')
    assert.deepStrictEqual(summary.canonicalConflictGroups[0].declaredOnUrls, [
      'https://example.com/shoes',
      'https://example.com/shoes-men',
      'https://example.com/shoes-sale',
    ])
  })
})

describe('runCrawl — BFS Depth Semantics & Plan Segregation', () => {
  const defaultRobotsMock = async () => ({
    rules: [],
  })

  function mockScan(url: string, discoveredInternalUrls: string[] = []): ScanResult {
    return createMockScan({
      url,
      finalUrl: url,
      discoveredInternalUrls,
    })
  }

  it('A/B/C: assigns root depth=0, internal child depth=1, grandchild depth=2', async () => {
    const links: Record<string, string[]> = {
      'https://example.com/': ['https://example.com/about'],
      'https://example.com/about': ['https://example.com/team'],
      'https://example.com/team': [],
    }

    const result = await runCrawl('https://example.com/', 'full', 'unknown', 'scan-1', {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url) => mockScan(url, links[url] || []),
    })

    assert.ok(result.architecture)
    assert.deepStrictEqual(result.architecture.depthDistribution, { 0: 1, 1: 1, 2: 1 })
    assert.strictEqual(result.architecture.maxDepth, 2)
  })

  it('D: sitemap-only unlinked page has unknown depth and is NOT put into depthDistribution', async () => {
    const links: Record<string, string[]> = {
      'https://example.com/': [],
      'https://example.com/orphan-sitemap': [],
    }

    const result = await runCrawl('https://example.com/', 'full', 'unknown', 'scan-2', {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => ['https://example.com/orphan-sitemap'],
      runQuickScan: async (url) => mockScan(url, links[url] || []),
    })

    assert.ok(result.architecture)
    // Only root is in depthDistribution; orphan-sitemap has unknown depth and is excluded
    assert.deepStrictEqual(result.architecture.depthDistribution, { 0: 1 })
    assert.strictEqual(result.architecture.maxDepth, 0)
    assert.deepStrictEqual(result.architecture.orphanCandidates, [
      'https://example.com/orphan-sitemap',
    ])
  })

  it('E: sitemap-seeded page later discovered by an internal link receives the actual BFS depth', async () => {
    // Sitemap seeds /pricing (initially unknown depth)
    // Root links to /features (depth 1), /features links to /pricing (depth 2)
    const links: Record<string, string[]> = {
      'https://example.com/': ['https://example.com/features'],
      'https://example.com/features': ['https://example.com/pricing'],
      'https://example.com/pricing': [],
    }

    const result = await runCrawl('https://example.com/', 'full', 'unknown', 'scan-3', {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => ['https://example.com/pricing'],
      runQuickScan: async (url) => mockScan(url, links[url] || []),
    })

    assert.ok(result.architecture)
    assert.deepStrictEqual(result.architecture.depthDistribution, { 0: 1, 1: 1, 2: 1 })
    assert.strictEqual(result.architecture.maxDepth, 2)
    assert.deepStrictEqual(result.architecture.orphanCandidates, [])
  })

  it('F: minimum BFS depth wins if multiple internal paths exist', async () => {
    // Root links to /hub (depth 1) and directly to /contact (depth 1)
    // /hub also links to /contact (path of length 2)
    const links: Record<string, string[]> = {
      'https://example.com/': ['https://example.com/hub', 'https://example.com/contact'],
      'https://example.com/hub': ['https://example.com/contact'],
      'https://example.com/contact': [],
    }

    const result = await runCrawl('https://example.com/', 'full', 'unknown', 'scan-4', {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url) => mockScan(url, links[url] || []),
    })

    assert.ok(result.architecture)
    // root (0), hub (1), contact (1) -> depth 0: 1, depth 1: 2
    assert.deepStrictEqual(result.architecture.depthDistribution, { 0: 1, 1: 2 })
    assert.strictEqual(result.architecture.maxDepth, 1)
  })

  it('H/I: Free/Quick results remain without architecture/duplicates; Full contains them', async () => {
    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, []),
    }

    const freeResult = await runCrawl('https://example.com/', 'free', 'unknown', 'free-1', mockDeps)
    assert.strictEqual(freeResult.architecture, undefined)
    assert.strictEqual(freeResult.duplicates, undefined)

    const quickResult = await runCrawl(
      'https://example.com/',
      'quick',
      'unknown',
      'quick-1',
      mockDeps
    )
    assert.strictEqual(quickResult.architecture, undefined)
    assert.strictEqual(quickResult.duplicates, undefined)

    const fullResult = await runCrawl('https://example.com/', 'full', 'unknown', 'full-1', mockDeps)
    assert.notStrictEqual(fullResult.architecture, undefined)
    assert.notStrictEqual(fullResult.duplicates, undefined)
  })
})
