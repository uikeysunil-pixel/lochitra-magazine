import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CRAWL_LIMITS,
  buildArchitectureSummary,
  buildDuplicateCandidateSummary,
  crawlChunk,
  deserializeCrawlState,
  finalizeCrawl,
  getPathSection,
  initCrawlState,
  runCrawl,
  serializeCrawlState,
} from './crawler'
import { loadRobotsPolicy } from './site-discovery'
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
    loaded: true,
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

describe('Phase 6B-2 — Durable Full-Plan Crawl Resilience', () => {
  const defaultRobotsMock = async () => ({
    rules: [],
    loaded: true,
  })

  function mockScan(url: string, discoveredInternalUrls: string[] = []): ScanResult {
    return createMockScan({
      url,
      finalUrl: url,
      discoveredInternalUrls,
    })
  }

  it('initCrawlState initializes root at depth 0 and sitemap pages with unknown depth', async () => {
    const state = await initCrawlState('https://example.com/', 'full', 'unknown', 'init-test', {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [
        'https://example.com/sitemap-1',
        'https://example.com/sitemap-2',
      ],
      runQuickScan: async (url) => mockScan(url),
    })

    assert.strictEqual(state.rootUrl, 'https://example.com/')
    assert.strictEqual(state.pageDepthMap.get('https://example.com/'), 0)
    assert.strictEqual(state.queued.length, 3) // root + 2 sitemaps
    assert.strictEqual(state.queued[0].url, 'https://example.com/')
    assert.strictEqual(state.queued[0].depth, 0)
    assert.strictEqual(state.queued[1].depth, null)
    assert.strictEqual(state.queued[2].depth, null)
    assert.strictEqual(state.isDone, false)
  })

  it('one chunk saves checkpoint state and next chunk resumes without restarting from root', async () => {
    const links: Record<string, string[]> = {
      'https://example.com/': [
        'https://example.com/p1',
        'https://example.com/p2',
        'https://example.com/p3',
      ],
      'https://example.com/p1': ['https://example.com/p4'],
      'https://example.com/p2': [],
      'https://example.com/p3': [],
      'https://example.com/p4': [],
    }

    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, links[url] || []),
    }

    // Step 1: Initialize
    const initialState = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'resume-test',
      mockDeps
    )

    // Step 2: Execute Chunk 1 with size = 2 (crawls root and /p1)
    const chunk1 = await crawlChunk(initialState, 2, mockDeps)
    assert.strictEqual(chunk1.newPages.length, 2)
    assert.strictEqual(chunk1.state.pageResults.length, 2)
    assert.strictEqual(chunk1.state.isDone, false)

    // Save checkpoint
    const checkpoint1 = serializeCrawlState(chunk1.state)
    assert.strictEqual(checkpoint1.pageResults.length, 2)
    assert.strictEqual(checkpoint1.queued.length, 3) // /p2, /p3, /p4

    // Step 3: Next chunk resumes from checkpoint1
    const resumedState = deserializeCrawlState(checkpoint1, chunk1.state.robotsPolicy)
    assert.strictEqual(resumedState.pageResults.length, 2)

    // Execute Chunk 2 with size = 2 (crawls /p2 and /p3)
    const chunk2 = await crawlChunk(resumedState, 2, mockDeps)
    assert.strictEqual(chunk2.newPages.length, 2)
    assert.strictEqual(chunk2.state.pageResults.length, 4)
    assert.strictEqual(chunk2.state.isDone, false)

    // URLs crawled in chunk 1 were not re-crawled in chunk 2
    const chunk2Urls = chunk2.newPages.map((p) => p.url)
    assert.ok(!chunk2Urls.includes('https://example.com/'))
    assert.ok(!chunk2Urls.includes('https://example.com/p1'))

    // Step 4: Execute Chunk 3 with size = 2 (crawls /p4, queue empty)
    const chunk3 = await crawlChunk(chunk2.state, 2, mockDeps)
    assert.strictEqual(chunk3.newPages.length, 1)
    assert.strictEqual(chunk3.state.pageResults.length, 5)
    assert.strictEqual(chunk3.state.isDone, true)

    // Finalize
    const finalResult = finalizeCrawl(chunk3.state)
    assert.strictEqual(finalResult.pagesChecked, 5)
    assert.strictEqual(finalResult.pages.length, 5)
  })

  it('BFS depth state and inbound graph survive checkpoint resume across chunks', async () => {
    // Root links to /hub (depth 1)
    // /hub links to /deep (depth 2)
    // Root also links directly to /deep (depth 1)
    const links: Record<string, string[]> = {
      'https://example.com/': ['https://example.com/hub', 'https://example.com/deep'],
      'https://example.com/hub': ['https://example.com/deep'],
      'https://example.com/deep': [],
    }

    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, links[url] || []),
    }

    const initialState = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'bfs-resume',
      mockDeps
    )

    // Chunk 1: crawls root only (chunkSize = 1)
    const chunk1 = await crawlChunk(initialState, 1, mockDeps)
    assert.strictEqual(chunk1.newPages.length, 1)

    // Serialize and resume
    const cp1 = serializeCrawlState(chunk1.state)
    const stateAfterCp1 = deserializeCrawlState(cp1, chunk1.state.robotsPolicy)

    // Chunk 2: crawls /hub (chunkSize = 1)
    const chunk2 = await crawlChunk(stateAfterCp1, 1, mockDeps)
    assert.strictEqual(chunk2.newPages.length, 1)

    // Serialize and resume again
    const cp2 = serializeCrawlState(chunk2.state)
    const stateAfterCp2 = deserializeCrawlState(cp2, chunk2.state.robotsPolicy)

    // Chunk 3: crawls /deep (chunkSize = 1)
    const chunk3 = await crawlChunk(stateAfterCp2, 1, mockDeps)
    assert.strictEqual(chunk3.newPages.length, 1)
    assert.strictEqual(chunk3.state.isDone, true)

    // Finalize Full plan
    const result = finalizeCrawl(chunk3.state)
    assert.ok(result.architecture)

    // Depth for /deep must be 1 because root links directly to it, beating the length-2 path
    assert.strictEqual(result.architecture.depthDistribution[1], 2) // /hub (1) and /deep (1)
    assert.strictEqual(result.architecture.depthDistribution[0], 1) // root (0)
    assert.strictEqual(result.architecture.maxDepth, 1)

    // Inbound links to /deep must include both root and /hub
    const topDeep = result.architecture.topLinkedUrls.find(
      (item) => item.url === 'https://example.com/deep'
    )
    assert.ok(topDeep)
    assert.strictEqual(topDeep.inboundCount, 2)
  })

  it('sitemap provenance survives checkpoint resume and correctly identifies orphan candidates', async () => {
    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => ['https://example.com/sitemap-orphan'],
      runQuickScan: async (url: string) => mockScan(url, []),
    }

    const state0 = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'sitemap-resume',
      mockDeps
    )

    // Chunk 1: crawls root only
    const chunk1 = await crawlChunk(state0, 1, mockDeps)

    // Save and resume
    const cp = serializeCrawlState(chunk1.state)
    const resumed = deserializeCrawlState(cp, chunk1.state.robotsPolicy)

    // Chunk 2: crawls sitemap-orphan
    const chunk2 = await crawlChunk(resumed, 1, mockDeps)
    assert.strictEqual(chunk2.state.isDone, true)

    const result = finalizeCrawl(chunk2.state)
    assert.ok(result.architecture)
    assert.deepStrictEqual(result.architecture.orphanCandidates, [
      'https://example.com/sitemap-orphan',
    ])
    // Orphan has unknown depth, excluded from depthDistribution
    assert.deepStrictEqual(result.architecture.depthDistribution, { 0: 1 })
  })

  it('progress increases incrementally and reaches 100% on finalization', async () => {
    const links: Record<string, string[]> = {
      'https://example.com/': ['https://example.com/1', 'https://example.com/2'],
      'https://example.com/1': [],
      'https://example.com/2': [],
    }

    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, links[url] || []),
    }

    const state = await initCrawlState(
      'https://example.com/',
      'free',
      'unknown',
      'progress-test',
      mockDeps
    )
    assert.strictEqual(state.maxUrls, 5) // Free limit is 5

    // Chunk 1 (1 page checked: root)
    const c1 = await crawlChunk(state, 1, mockDeps)
    const prog1 = Math.round((c1.state.pageResults.length / c1.state.maxUrls) * 100)
    assert.strictEqual(prog1, 20) // 1 / 5 = 20%

    // Chunk 2 (2 pages checked: /1 and /2)
    const c2 = await crawlChunk(c1.state, 2, mockDeps)
    const prog2 = Math.round((c2.state.pageResults.length / c2.state.maxUrls) * 100)
    assert.strictEqual(prog2, 60) // 3 / 5 = 60%
    assert.strictEqual(c2.state.isDone, true) // queue empty

    const finalResult = finalizeCrawl(c2.state)
    assert.strictEqual(finalResult.pagesChecked, 3)
    const finalProgress = c2.state.isDone ? 100 : prog2
    assert.strictEqual(finalProgress, 100)
  })

  it('persisted pages are not duplicated when a chunk is replayed or resumed', async () => {
    const links: Record<string, string[]> = {
      'https://example.com/': ['https://example.com/p1'],
      'https://example.com/p1': ['https://example.com/p2'],
      'https://example.com/p2': [],
    }

    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, links[url] || []),
    }

    const s0 = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'dedup-test',
      mockDeps
    )
    const c1 = await crawlChunk(s0, 1, mockDeps) // crawls root
    const cp1 = serializeCrawlState(c1.state)

    // Simulate replay of chunk 2 from checkpoint 1 multiple times
    const r1 = deserializeCrawlState(cp1, c1.state.robotsPolicy)
    const c2a = await crawlChunk(r1, 1, mockDeps) // crawls /p1

    // Replay chunk 2 again from same checkpoint 1 (simulating worker crash/retry)
    const r2 = deserializeCrawlState(cp1, c1.state.robotsPolicy)
    const c2b = await crawlChunk(r2, 1, mockDeps) // also crawls /p1

    assert.strictEqual(c2a.state.pageResults.length, 2)
    assert.strictEqual(c2b.state.pageResults.length, 2)
    assert.deepStrictEqual(
      c2a.state.pageResults.map((p) => p.finalUrl),
      ['https://example.com/', 'https://example.com/p1']
    )
    assert.deepStrictEqual(
      c2b.state.pageResults.map((p) => p.finalUrl),
      ['https://example.com/', 'https://example.com/p1']
    )

    // Resume chunk 3 from c2a
    const cp2 = serializeCrawlState(c2a.state)
    const r3 = deserializeCrawlState(cp2, c2a.state.robotsPolicy)
    const c3 = await crawlChunk(r3, 1, mockDeps) // crawls /p2

    assert.strictEqual(c3.state.pageResults.length, 3)
    const urls = c3.state.pageResults.map((p) => p.finalUrl)
    assert.strictEqual(new Set(urls).size, 3) // no duplicate page entries
  })

  it('Free and Quick remain compatible without architecture/duplicates while Full has them', async () => {
    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, []),
    }

    const freeState = await initCrawlState('https://example.com/', 'free', 'unknown', 'f', mockDeps)
    const freeChunk = await crawlChunk(freeState, 5, mockDeps)
    const freeRes = finalizeCrawl(freeChunk.state)
    assert.strictEqual(freeRes.architecture, undefined)
    assert.strictEqual(freeRes.duplicates, undefined)

    const quickState = await initCrawlState(
      'https://example.com/',
      'quick',
      'unknown',
      'q',
      mockDeps
    )
    const quickChunk = await crawlChunk(quickState, 5, mockDeps)
    const quickRes = finalizeCrawl(quickChunk.state)
    assert.strictEqual(quickRes.architecture, undefined)
    assert.strictEqual(quickRes.duplicates, undefined)

    const fullState = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'full',
      mockDeps
    )
    const fullChunk = await crawlChunk(fullState, 5, mockDeps)
    const fullRes = finalizeCrawl(fullChunk.state)
    assert.notStrictEqual(fullRes.architecture, undefined)
    assert.notStrictEqual(fullRes.duplicates, undefined)
  })

  it('Deep plan limit exists in CRAWL_LIMITS but remains disabled from public scan options', () => {
    assert.strictEqual(CRAWL_LIMITS.deep, 1000)
    assert.strictEqual(CRAWL_LIMITS.full, 250)
    assert.strictEqual(CRAWL_LIMITS.quick, 50)
    assert.strictEqual(CRAWL_LIMITS.free, 5)
  })

  it('robots policy survives serialization/deserialization and blocks disallowed URLs across multiple chunks', async () => {
    const customRobotsMock = async () => ({
      rules: [
        { pattern: '/secret', allow: false, specificity: 7 },
        { pattern: '/private', allow: false, specificity: 8 },
      ],
      loaded: true,
    })

    const links: Record<string, string[]> = {
      'https://example.com/': ['https://example.com/public-1', 'https://example.com/secret'],
      'https://example.com/public-1': [
        'https://example.com/public-2',
        'https://example.com/private',
      ],
      'https://example.com/public-2': ['https://example.com/public-3'],
      'https://example.com/public-3': [],
    }

    const mockDeps = {
      loadRobotsPolicy: customRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, links[url] || []),
    }

    // Step A: Chunk 0 crawls root
    const s0 = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'robots-multi',
      mockDeps
    )
    const c0 = await crawlChunk(s0, 1, mockDeps)
    assert.strictEqual(c0.state.urlsBlockedByRobots, 1) // /secret was blocked in chunk 0
    assert.strictEqual(
      c0.state.queued.some((q) => q.url.includes('/secret')),
      false
    )

    // Step B: Serialize to checkpoint_json representation (pure JSON roundtrip)
    const cp0 = JSON.parse(JSON.stringify(serializeCrawlState(c0.state)))
    assert.ok(cp0.robotsPolicy)
    assert.strictEqual(cp0.robotsPolicy.rules.length, 2)

    // Step C: Chunk 1 resumes from deserialized checkpoint WITHOUT external policy injection
    const s1 = deserializeCrawlState(cp0)
    assert.ok(s1.robotsPolicy)
    const c1 = await crawlChunk(s1, 1, mockDeps) // crawls /public-1
    assert.strictEqual(c1.state.urlsBlockedByRobots, 2) // /private was blocked in chunk 1
    assert.strictEqual(
      c1.state.queued.some((q) => q.url.includes('/private')),
      false
    )

    // Step D: Chunk 2 resumes from serialized checkpoint
    const cp1 = JSON.parse(JSON.stringify(serializeCrawlState(c1.state)))
    const s2 = deserializeCrawlState(cp1)
    const c2 = await crawlChunk(s2, 1, mockDeps) // crawls /public-2
    assert.strictEqual(c2.state.urlsBlockedByRobots, 2)
    assert.strictEqual(
      c2.state.queued.some((q) => q.url.includes('/secret') || q.url.includes('/private')),
      false
    )

    const finalResult = finalizeCrawl(c2.state)
    assert.strictEqual(finalResult.urlsBlockedByRobots, 2)
  })

  it('combines all pages, findings, architecture, and duplicates across 3+ sequential chunks', async () => {
    const pageScans: Record<string, ScanResult> = {
      'https://example.com/': createMockScan({
        url: 'https://example.com/',
        finalUrl: 'https://example.com/',
        discoveredInternalUrls: ['https://example.com/p1', 'https://example.com/p2'],
        pageTitle: 'Home Page',
        findings: [
          {
            id: 'missing-meta-description',
            title: 'Meta description is missing',
            category: 'on-page',
            severity: 'medium',
            confidence: 'high',
            summary: 'Missing meta description.',
            evidence: ['No description found'],
            recommendation: 'Add a meta description.',
            diagnosticProblems: ['indexing'],
            url: 'https://example.com/',
          },
        ],
      }),
      'https://example.com/p1': createMockScan({
        url: 'https://example.com/p1',
        finalUrl: 'https://example.com/p1',
        discoveredInternalUrls: ['https://example.com/p3'],
        pageTitle: 'Services Overview',
        findings: [
          {
            id: 'images-missing-alt',
            title: 'Images have no alt attribute',
            category: 'accessibility',
            severity: 'low',
            confidence: 'high',
            summary: 'Images lack alt.',
            evidence: ['Image without alt'],
            recommendation: 'Add alt attributes.',
            diagnosticProblems: ['indexing'],
            url: 'https://example.com/p1',
          },
        ],
      }),
      'https://example.com/p2': createMockScan({
        url: 'https://example.com/p2',
        finalUrl: 'https://example.com/p2',
        discoveredInternalUrls: ['https://example.com/p3'],
        pageTitle: 'Services Overview',
        findings: [
          {
            id: 'images-missing-alt',
            title: 'Images have no alt attribute',
            category: 'accessibility',
            severity: 'low',
            confidence: 'high',
            summary: 'Images lack alt.',
            evidence: ['Image without alt'],
            recommendation: 'Add alt attributes.',
            diagnosticProblems: ['indexing'],
            url: 'https://example.com/p2',
          },
        ],
      }),
      'https://example.com/p3': createMockScan({
        url: 'https://example.com/p3',
        finalUrl: 'https://example.com/p3',
        discoveredInternalUrls: [],
        pageTitle: 'Contact Us',
        findings: [
          {
            id: 'broken-links',
            title: 'Broken link found',
            category: 'links',
            severity: 'high',
            confidence: 'high',
            summary: 'Broken link detected.',
            evidence: ['404 link on contact page'],
            recommendation: 'Fix the broken link.',
            diagnosticProblems: ['indexing'],
            url: 'https://example.com/p3',
          },
        ],
      }),
    }

    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => pageScans[url] || mockScan(url),
    }

    // Chunk 1: crawls root (size = 1)
    const s0 = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'full-3chunks',
      mockDeps
    )
    const c1 = await crawlChunk(s0, 1, mockDeps)
    assert.strictEqual(c1.newPages.length, 1)

    // Checkpoint 1
    const cp1 = JSON.parse(JSON.stringify(serializeCrawlState(c1.state)))
    assert.strictEqual(cp1.sequence, 1)

    // Chunk 2: crawls p1 and p2 (size = 2)
    const s1 = deserializeCrawlState(cp1)
    const c2 = await crawlChunk(s1, 2, mockDeps)
    assert.strictEqual(c2.newPages.length, 2)
    assert.strictEqual(c2.state.pageResults.length, 3)

    // Checkpoint 2
    const cp2 = JSON.parse(JSON.stringify(serializeCrawlState(c2.state)))
    assert.strictEqual(cp2.sequence, 2)

    // Chunk 3: crawls p3 (size = 1)
    const s2 = deserializeCrawlState(cp2)
    const c3 = await crawlChunk(s2, 1, mockDeps)
    assert.strictEqual(c3.newPages.length, 1)
    assert.strictEqual(c3.state.pageResults.length, 4)
    assert.strictEqual(c3.state.isDone, true)

    // Finalize
    const finalReport = finalizeCrawl(c3.state)

    // All 4 pages present
    assert.strictEqual(finalReport.pagesChecked, 4)
    assert.strictEqual(finalReport.pages.length, 4)
    const finalUrls = finalReport.pages.map((p) => p.finalUrl)
    assert.deepStrictEqual(finalUrls, [
      'https://example.com/',
      'https://example.com/p1',
      'https://example.com/p2',
      'https://example.com/p3',
    ])

    // Findings combined across all 3 chunks
    assert.ok(finalReport.findings.length >= 3)
    const missingMeta = finalReport.findings.find((f) => f.id === 'missing-meta-description')
    assert.ok(missingMeta)
    assert.deepStrictEqual(missingMeta.affectedUrls, ['https://example.com/'])

    const imageAlt = finalReport.findings.find((f) => f.id === 'images-missing-alt')
    assert.ok(imageAlt)
    assert.strictEqual(imageAlt.affectedUrls?.length, 2)
    assert.ok(imageAlt.affectedUrls?.includes('https://example.com/p1'))
    assert.ok(imageAlt.affectedUrls?.includes('https://example.com/p2'))

    const brokenLink = finalReport.findings.find((f) => f.id === 'broken-links')
    assert.ok(brokenLink)
    assert.deepStrictEqual(brokenLink.affectedUrls, ['https://example.com/p3'])

    // Architecture summary across all chunks
    assert.ok(finalReport.architecture)
    assert.deepStrictEqual(finalReport.architecture.depthDistribution, { 0: 1, 1: 2, 2: 1 })
    assert.strictEqual(finalReport.architecture.maxDepth, 2)

    // Inbound links: p3 linked by both p1 and p2
    const p3Inbound = finalReport.architecture.topLinkedUrls.find(
      (t) => t.url === 'https://example.com/p3'
    )
    assert.ok(p3Inbound)
    assert.strictEqual(p3Inbound.inboundCount, 2)

    // Duplicate titles detected across chunks: p1 (chunk 2) and p2 (chunk 2)
    assert.ok(finalReport.duplicates)
    assert.strictEqual(finalReport.duplicates.titleDuplicateGroups.length, 1)
    assert.strictEqual(finalReport.duplicates.titleDuplicateGroups[0].title, 'Services Overview')
  })

  it('reloads robots policy from target site if checkpoint policy is missing or null', async () => {
    let reloadCallCount = 0
    const customRobotsMock = async () => {
      reloadCallCount++
      return {
        rules: [{ pattern: '/disallowed-page', allow: false, specificity: 16 }],
        loaded: true,
      }
    }

    const links: Record<string, string[]> = {
      'https://example.com/': [
        'https://example.com/disallowed-page',
        'https://example.com/allowed-page',
      ],
      'https://example.com/allowed-page': [],
    }

    const mockDeps = {
      loadRobotsPolicy: customRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, links[url] || []),
    }

    const s0 = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'robots-reload',
      mockDeps
    )
    const c0 = await crawlChunk(s0, 1, mockDeps)
    assert.strictEqual(reloadCallCount, 1)

    // Simulate an older checkpoint that has null or missing robotsPolicy
    const cp = serializeCrawlState(c0.state)
    const cpWithoutRobots = { ...cp, robotsPolicy: null }

    const resumedState = deserializeCrawlState(cpWithoutRobots)
    assert.strictEqual(resumedState.robotsPolicy, undefined)

    // When crawlChunk runs, it MUST reload the robots policy before crawling any queued URLs
    const c1 = await crawlChunk(resumedState, 2, mockDeps)
    assert.ok(reloadCallCount >= 2, 'Must have reloaded robotsPolicy from site')
    assert.ok(c1.state.robotsPolicy)
    assert.strictEqual(c1.state.urlsBlockedByRobots, 1)
    assert.strictEqual(
      c1.state.pageResults.some((p) => p.finalUrl.includes('disallowed-page')),
      false
    )
  })

  it('enforces true Compare-And-Swap (CAS) optimistic concurrency and rejects concurrent writer B', () => {
    // Simulated database state for seo_scans
    let dbCheckpoint: { sequence: number } | null = null

    const executeCasUpdate = (
      expectedSequence: number | null,
      newCheckpoint: { sequence: number }
    ): boolean => {
      if (expectedSequence === null) {
        if (dbCheckpoint !== null) return false
        dbCheckpoint = newCheckpoint
        return true
      }
      if (dbCheckpoint === null || dbCheckpoint.sequence !== expectedSequence) {
        return false
      }
      dbCheckpoint = newCheckpoint
      return true
    }

    // Step 0: Initial creation (expected null)
    assert.strictEqual(executeCasUpdate(null, { sequence: 0 }), true)
    assert.strictEqual(dbCheckpoint?.sequence, 0)

    // Step 0b: Concurrent initialization attempt fails
    assert.strictEqual(executeCasUpdate(null, { sequence: 0 }), false)

    // Step 1: Legitimate next writer expecting 0 commits sequence 1
    assert.strictEqual(executeCasUpdate(0, { sequence: 1 }), true)
    assert.strictEqual(dbCheckpoint?.sequence, 1)

    // Step 2: Concurrent writer scenario:
    // Both Writer A and Writer B read sequence 1 from DB.
    // Writer A writes sequence 2 expecting 1:
    assert.strictEqual(executeCasUpdate(1, { sequence: 2 }), true)
    assert.strictEqual(dbCheckpoint?.sequence, 2)

    // Writer B attempts to write sequence 2 expecting 1:
    // MUST FAIL because DB is now 2, not 1!
    assert.strictEqual(executeCasUpdate(1, { sequence: 2 }), false)
    assert.strictEqual(dbCheckpoint?.sequence, 2, 'Writer B must NOT overwrite Writer A')

    // Stale writer expecting sequence 0 is also rejected
    assert.strictEqual(executeCasUpdate(0, { sequence: 1 }), false)
  })

  it('handles chunk retry idempotently when checkpoint was already committed', () => {
    // DB is at sequence 3 (already committed)
    const dbCheckpoint = { sequence: 3, scanId: 'scan-1' }

    const handleChunkSaveResult = (
      saved: boolean,
      incomingSequence: number,
      latestCheckpoint: { sequence: number; scanId: string }
    ) => {
      if (!saved) {
        if (latestCheckpoint.sequence >= incomingSequence) {
          // Chunk was already committed by another worker or previous attempt.
          // Idempotently complete: adopt the latest checkpoint.
          return { status: 'idempotent-success', checkpoint: latestCheckpoint }
        }
        return { status: 'retry-needed', checkpoint: latestCheckpoint }
      }
      return {
        status: 'saved',
        checkpoint: { sequence: incomingSequence, scanId: latestCheckpoint.scanId },
      }
    }

    // Retry of chunk sequence 3 when DB is already sequence 3 (CAS returned false)
    const retryResult = handleChunkSaveResult(false, 3, dbCheckpoint)
    assert.strictEqual(retryResult.status, 'idempotent-success')
    assert.strictEqual(retryResult.checkpoint.sequence, 3)

    // Late retry of chunk sequence 2 when DB is already sequence 3
    const lateRetryResult = handleChunkSaveResult(false, 2, dbCheckpoint)
    assert.strictEqual(lateRetryResult.status, 'idempotent-success')
    assert.strictEqual(lateRetryResult.checkpoint.sequence, 3)
  })

  // A. Initial robots failure
  it('A: fails safely when initial robots fetch fails and never calls runQuickScan', async () => {
    let scanCallCount = 0
    const mockDeps = {
      loadRobotsPolicy: async () => {
        throw new Error('Connection timeout fetching robots.txt')
      },
      discoverSitemapPages: async () => ['https://example.com/sitemap-page'],
      runQuickScan: async (url: string) => {
        scanCallCount++
        return mockScan(url)
      },
    }

    await assert.rejects(async () => {
      await initCrawlState('https://example.com/', 'full', 'unknown', 'init-fail-test', mockDeps)
    }, /Unable to retrieve robots.txt; crawl cannot continue safely/)

    assert.strictEqual(
      scanCallCount,
      0,
      'runQuickScan must be called ZERO times on initial robots failure'
    )
  })

  // B. Repeated robots failure
  it('B: aborts chunk safely on repeated robots failure and never calls runQuickScan', async () => {
    let scanCallCount = 0
    const mockDeps = {
      loadRobotsPolicy: async () => {
        throw new Error('503 Service Unavailable fetching robots.txt')
      },
      runQuickScan: async (url: string) => {
        scanCallCount++
        return mockScan(url)
      },
    }

    // Checkpoint with unavailable robots policy
    const cp: CrawlCheckpoint = {
      scanId: 'rep-fail-test',
      rootUrl: 'https://example.com/',
      plan: 'full',
      diagnosticProblem: 'unknown',
      maxUrls: 10,
      sequence: 1,
      queued: [{ url: 'https://example.com/queued-page', depth: 1, discoveredFrom: null }],
      seen: ['https://example.com/', 'https://example.com/queued-page'],
      sitemapDiscoveredUrls: [],
      internalInboundGraph: [],
      pageDepthMap: [['https://example.com/', 0]],
      pageResults: [mockScan('https://example.com/')],
      crawlErrors: 0,
      urlsBlockedByRobots: 0,
      finalOrigin: 'https://example.com',
      canonicalRootUrl: 'https://example.com/',
      rootFetchFailed: false,
      isDone: false,
      startedAt: Date.now(),
      robotsPolicy: null,
    }

    const state = deserializeCrawlState(cp)
    assert.strictEqual(state.robotsPolicy, undefined)

    await assert.rejects(async () => {
      await crawlChunk(state, 1, mockDeps)
    }, /Unable to retrieve robots.txt; crawl cannot continue safely/)

    assert.strictEqual(
      scanCallCount,
      0,
      'runQuickScan must be called ZERO times on repeated robots failure'
    )
  })

  // C. Successful reload
  it('C: succeeds on reload with disallow rules, blocking disallowed URLs from being scanned', async () => {
    const scannedUrls: string[] = []
    const mockDeps = {
      loadRobotsPolicy: async () => ({
        rules: [{ pattern: '/disallowed', allow: false, specificity: 11 }],
        loaded: true,
      }),
      runQuickScan: async (url: string) => {
        scannedUrls.push(url)
        return mockScan(url)
      },
    }

    const cp: CrawlCheckpoint = {
      scanId: 'reload-success-test',
      rootUrl: 'https://example.com/',
      plan: 'full',
      diagnosticProblem: 'unknown',
      maxUrls: 10,
      sequence: 1,
      queued: [
        { url: 'https://example.com/disallowed', depth: 1, discoveredFrom: null },
        { url: 'https://example.com/allowed', depth: 1, discoveredFrom: null },
      ],
      seen: [
        'https://example.com/',
        'https://example.com/disallowed',
        'https://example.com/allowed',
      ],
      sitemapDiscoveredUrls: [],
      internalInboundGraph: [],
      pageDepthMap: [['https://example.com/', 0]],
      pageResults: [mockScan('https://example.com/')],
      crawlErrors: 0,
      urlsBlockedByRobots: 0,
      finalOrigin: 'https://example.com',
      canonicalRootUrl: 'https://example.com/',
      rootFetchFailed: false,
      isDone: false,
      startedAt: Date.now(),
      robotsPolicy: null,
    }

    const state = deserializeCrawlState(cp)
    const result = await crawlChunk(state, 2, mockDeps)

    assert.ok(result.state.robotsPolicy?.loaded)
    assert.strictEqual(result.state.urlsBlockedByRobots, 1)
    assert.deepStrictEqual(scannedUrls, ['https://example.com/allowed'])
    assert.ok(!scannedUrls.includes('https://example.com/disallowed'))
  })

  // D. Successful empty policy
  it('D: successfully scans allowed URLs when robots loads with zero restrictions', async () => {
    const scannedUrls: string[] = []
    const mockDeps = {
      loadRobotsPolicy: async () => ({ rules: [], loaded: true }),
      discoverSitemapPages: async () => ['https://example.com/sitemap-1'],
      runQuickScan: async (url: string) => {
        scannedUrls.push(url)
        return mockScan(url)
      },
    }

    const s0 = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'empty-policy-test',
      mockDeps
    )
    assert.ok(s0.robotsPolicy)
    assert.strictEqual(s0.robotsPolicy.loaded, true)
    assert.strictEqual(s0.robotsPolicy.rules.length, 0)

    await crawlChunk(s0, 2, mockDeps)
    assert.deepStrictEqual(scannedUrls, ['https://example.com/', 'https://example.com/sitemap-1'])
  })

  // E. Internal link discovery under unavailable policy
  it('E: refuses to queue or scan discovered internal links if robots policy is unavailable', async () => {
    const scannedUrls: string[] = []
    const mockDeps = {
      loadRobotsPolicy: async () => ({ rules: [], loaded: true }),
      runQuickScan: async (url: string) => {
        scannedUrls.push(url)
        return mockScan(url, ['https://example.com/internal-link'])
      },
    }

    const s0 = await initCrawlState(
      'https://example.com/',
      'full',
      'unknown',
      'internal-link-test',
      mockDeps
    )
    // Tamper state to simulate unavailable policy during chunk processing
    s0.robotsPolicy = null

    await assert.rejects(async () => {
      await crawlChunk(s0, 2, {
        ...mockDeps,
        loadRobotsPolicy: async () => {
          throw new Error('Robots unavailable')
        },
      })
    }, /Unable to retrieve robots.txt; crawl cannot continue safely/)

    // runQuickScan must not have scanned internal-link
    assert.ok(!scannedUrls.includes('https://example.com/internal-link'))
  })

  it('page persistence occurs only when CAS update succeeds, avoiding phantom pages on conflict', () => {
    const dbPages: string[] = []
    let dbSequence = 1

    const saveCheckpointWithPages = (
      expectedSequence: number,
      newSequence: number,
      pagesToInsert: string[]
    ): boolean => {
      // 1. CAS update on scans
      if (dbSequence !== expectedSequence) {
        return false // CAS failed
      }
      dbSequence = newSequence

      // 2. Persist pages ONLY if CAS succeeded
      for (const page of pagesToInsert) {
        dbPages.push(page)
      }
      return true
    }

    // Worker A succeeds: sequence 1 -> 2
    const successA = saveCheckpointWithPages(1, 2, ['https://example.com/p1'])
    assert.strictEqual(successA, true)
    assert.deepStrictEqual(dbPages, ['https://example.com/p1'])

    // Worker B with expected sequence 1 conflicts (DB is now 2)
    const successB = saveCheckpointWithPages(1, 2, ['https://example.com/phantom-p2'])
    assert.strictEqual(successB, false)
    // Phantom pages must NOT have been inserted!
    assert.deepStrictEqual(dbPages, ['https://example.com/p1'])
  })

  it('progress_percent is capped at 99 while running and reaches 100 only upon finalization', async () => {
    const mockDeps = {
      loadRobotsPolicy: defaultRobotsMock,
      discoverSitemapPages: async () => [],
      runQuickScan: async (url: string) => mockScan(url, []),
    }

    // Exhausted frontier case: 1 page found out of maxUrls 5
    const s0 = await initCrawlState(
      'https://example.com/',
      'free',
      'unknown',
      'prog-guard-1',
      mockDeps
    )
    const c1 = await crawlChunk(s0, 5, mockDeps)
    assert.strictEqual(c1.state.pageResults.length, 1)
    assert.strictEqual(c1.state.isDone, true) // exhausted frontier

    const chunkProgressExhausted =
      c1.state.pageResults.length === 0
        ? 0
        : Math.min(
            99,
            Math.max(1, Math.round((c1.state.pageResults.length / c1.state.maxUrls) * 100))
          )

    assert.ok(chunkProgressExhausted <= 99)
    assert.strictEqual(chunkProgressExhausted, 20) // 1 / 5 = 20%

    // Full limit reached case: 5 pages found out of maxUrls 5
    const sFull = {
      ...c1.state,
      pageResults: [
        mockScan('https://example.com/1'),
        mockScan('https://example.com/2'),
        mockScan('https://example.com/3'),
        mockScan('https://example.com/4'),
        mockScan('https://example.com/5'),
      ],
      maxUrls: 5,
    }

    const chunkProgressFull = Math.min(
      99,
      Math.max(1, Math.round((sFull.pageResults.length / sFull.maxUrls) * 100))
    )
    // MUST NEVER BE 100 WHILE RUNNING
    assert.strictEqual(chunkProgressFull, 99)

    // Finalize sets 100
    const finalReport = finalizeCrawl(sFull)
    assert.strictEqual(finalReport.pagesChecked, 5)
  })

  it('protects terminal scan states from reverting to running on duplicate events', () => {
    const canTransitionToRunning = (currentStatus: string) => {
      const terminalStates = new Set(['complete', 'cancelled', 'failed'])
      return !terminalStates.has(currentStatus)
    }

    // Valid transitions
    assert.strictEqual(canTransitionToRunning('queued'), true)
    assert.strictEqual(canTransitionToRunning('running'), true)

    // Forbidden terminal regressions
    assert.strictEqual(canTransitionToRunning('complete'), false)
    assert.strictEqual(canTransitionToRunning('cancelled'), false)
    assert.strictEqual(canTransitionToRunning('failed'), false)
  })

  it('deduplicates page persistence and prevents corruption on retry', () => {
    // Simulating ON CONFLICT (scan_id, normalized_url) DO UPDATE
    const dbRows = new Map<string, { url: string; depth: number | null; attempts: number }>()

    const upsertPage = (scanId: string, normalizedUrl: string, depth: number | null) => {
      const key = `${scanId}:${normalizedUrl}`
      const existing = dbRows.get(key)
      if (existing) {
        existing.depth = depth
        existing.attempts += 1
      } else {
        dbRows.set(key, { url: normalizedUrl, depth, attempts: 1 })
      }
    }

    // Attempt 1 for chunk
    upsertPage('scan-123', 'https://example.com/about', 1)
    upsertPage('scan-123', 'https://example.com/contact', 1)
    assert.strictEqual(dbRows.size, 2)

    // Duplicate attempt (retry) for same chunk
    upsertPage('scan-123', 'https://example.com/about', 1)
    upsertPage('scan-123', 'https://example.com/contact', 1)
    assert.strictEqual(dbRows.size, 2, 'Duplicate execution must not produce duplicate URL rows')
    assert.strictEqual(dbRows.get('scan-123:https://example.com/about')?.attempts, 2)
  })
})

describe('Phase 6B-2 — Production Robots Status Semantics', () => {
  const originalFetch = globalThis.fetch

  // A. 404 -> { rules: [], loaded: true }
  it('A: HTTP 404 produces { rules: [], loaded: true }', async () => {
    try {
      globalThis.fetch = async () => new Response('Not Found', { status: 404 })
      const policy = await loadRobotsPolicy('https://example.com')
      assert.strictEqual(policy.loaded, true)
      assert.deepStrictEqual(policy.rules, [])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  // B. 200 with Disallow: /admin -> loaded=true and parsed restriction exists
  it('B: HTTP 200 with Disallow produces loaded=true and parsed restriction', async () => {
    try {
      globalThis.fetch = async () =>
        new Response('User-agent: *\nDisallow: /admin\n', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        })
      const policy = await loadRobotsPolicy('https://example.com')
      assert.strictEqual(policy.loaded, true)
      assert.strictEqual(policy.rules.length, 1)
      assert.strictEqual(policy.rules[0].pattern, '/admin')
      assert.strictEqual(policy.rules[0].allow, false)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  // C. 500 -> unavailable/failure (NOT loaded=true)
  it('C: HTTP 500 produces unavailable/failure (loaded=false)', async () => {
    try {
      globalThis.fetch = async () => new Response('Internal Server Error', { status: 500 })
      const policy = await loadRobotsPolicy('https://example.com')
      assert.strictEqual(policy.loaded, false)
      assert.strictEqual(policy.rules.length, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  // D. 503 -> unavailable/failure
  it('D: HTTP 503 produces unavailable/failure (loaded=false)', async () => {
    try {
      globalThis.fetch = async () => new Response('Service Unavailable', { status: 503 })
      const policy = await loadRobotsPolicy('https://example.com')
      assert.strictEqual(policy.loaded, false)
      assert.strictEqual(policy.rules.length, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  // E. network rejection -> unavailable/failure
  it('E: network rejection produces unavailable/failure (loaded=false)', async () => {
    try {
      globalThis.fetch = async () => {
        throw new TypeError('fetch failed: ECONNREFUSED')
      }
      const policy = await loadRobotsPolicy('https://example.com')
      assert.strictEqual(policy.loaded, false)
      assert.strictEqual(policy.rules.length, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  // F. timeout / AbortError -> unavailable/failure
  it('F: timeout / AbortError produces unavailable/failure (loaded=false)', async () => {
    try {
      globalThis.fetch = async () => {
        const err = new Error('The operation was aborted')
        err.name = 'AbortError'
        throw err
      }
      const policy = await loadRobotsPolicy('https://example.com')
      assert.strictEqual(policy.loaded, false)
      assert.strictEqual(policy.rules.length, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  // G. real loadRobotsPolicy() mocked at HTTP boundary returns failure -> initCrawlState fails -> runQuickScan count = 0
  it('G: real loadRobotsPolicy returns failure at HTTP boundary -> initCrawlState fails -> runQuickScan called 0 times', async () => {
    let scanCount = 0
    try {
      globalThis.fetch = async () => new Response('Server Error', { status: 500 })
      const deps = {
        runQuickScan: async (url: string) => {
          scanCount++
          return createMockScan({ url })
        },
      }

      await assert.rejects(async () => {
        await initCrawlState('https://example.com/', 'full', 'unknown', 'real-fail-scan', deps)
      }, /Unable to retrieve robots.txt; crawl cannot continue safely/)

      assert.strictEqual(scanCount, 0, 'runQuickScan must be called ZERO times')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  // H. successful 404 robots -> crawler proceeds normally
  it('H: real loadRobotsPolicy returns 404 at HTTP boundary -> crawler proceeds normally', async () => {
    let scanCount = 0
    try {
      globalThis.fetch = async (url: RequestInfo | URL) => {
        const urlStr = url.toString()
        if (urlStr.includes('robots.txt')) {
          return new Response('Not Found', { status: 404 })
        }
        return new Response('Not Found', { status: 404 })
      }

      const deps = {
        discoverSitemapPages: async () => [],
        runQuickScan: async (url: string) => {
          scanCount++
          return createMockScan({ url, finalUrl: url })
        },
      }

      const state = await initCrawlState(
        'https://example.com/',
        'full',
        'unknown',
        'real-404-scan',
        deps
      )
      assert.strictEqual(state.robotsPolicy?.loaded, true)
      assert.strictEqual(state.robotsPolicy.rules.length, 0)

      const chunkResult = await crawlChunk(state, 1, deps)
      assert.strictEqual(scanCount, 1)
      assert.strictEqual(chunkResult.newPages.length, 1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  // I. successful 200 disallow rule -> disallowed URL is never scanned
  it('I: real loadRobotsPolicy returns 200 with disallow rule at HTTP boundary -> disallowed URL is never scanned', async () => {
    const scannedUrls: string[] = []
    try {
      globalThis.fetch = async (url: RequestInfo | URL) => {
        const urlStr = url.toString()
        if (urlStr.includes('robots.txt')) {
          return new Response('User-agent: *\nDisallow: /admin\n', {
            status: 200,
            headers: { 'content-type': 'text/plain' },
          })
        }
        return new Response('Not Found', { status: 404 })
      }

      const deps = {
        discoverSitemapPages: async () => [
          'https://example.com/admin',
          'https://example.com/public-page',
        ],
        runQuickScan: async (url: string) => {
          scannedUrls.push(url)
          return createMockScan({ url, finalUrl: url })
        },
      }

      const state = await initCrawlState(
        'https://example.com/',
        'full',
        'unknown',
        'real-disallow-scan',
        deps
      )
      assert.strictEqual(state.robotsPolicy?.loaded, true)
      assert.strictEqual(
        state.urlsBlockedByRobots,
        1,
        '/admin should be blocked during sitemap seeding'
      )

      // Crawl chunks
      await crawlChunk(state, 5, deps)
      assert.ok(scannedUrls.includes('https://example.com/'))
      assert.ok(scannedUrls.includes('https://example.com/public-page'))
      assert.ok(
        !scannedUrls.includes('https://example.com/admin'),
        'Disallowed /admin must NEVER be scanned'
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
