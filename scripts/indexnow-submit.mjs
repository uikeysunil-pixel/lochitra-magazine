import fs from 'fs'
import esbuild from 'esbuild'
import siteMetadata from '../data/siteMetadata.js'
import { allBlogs } from '../.contentlayer/generated/index.mjs'

export async function submitIndexNow() {
  console.log('\n[IndexNow] Starting automated submission...')

  try {
    // 1. Transpile the TypeScript utility on-the-fly using esbuild
    const tsCode = fs.readFileSync('./lib/indexnow.ts', 'utf-8')
    const { code } = esbuild.transformSync(tsCode, { loader: 'ts', format: 'esm' })
    const tempFile = './scripts/.indexnow-temp.mjs'
    fs.writeFileSync(tempFile, code)

    // 2. Import the transpiled utility
    const { submitToIndexNow, getSiteUrl } = await import('./.indexnow-temp.mjs')

    // Clean up temp file immediately so it doesn't linger
    fs.unlinkSync(tempFile)

    const siteUrl = getSiteUrl() || siteMetadata.siteUrl
    const urlsToSubmit = new Set()

    // 3. Always submit Homepage and Priority Category pages
    urlsToSubmit.add(`${siteUrl}/`)
    urlsToSubmit.add(`${siteUrl}/categories`)

    // Discover unique categories from the actual blog posts
    const activeCategories = new Set(allBlogs.map((post) => post.category).filter(Boolean))
    for (const category of activeCategories) {
      // Basic slugification (lowercase, replace spaces with hyphens)
      const slug = category.toLowerCase().replace(/\s+/g, '-')
      urlsToSubmit.add(`${siteUrl}/categories/${slug}`)
    }

    // 4. Smart URL Discovery: Find recently created or modified articles
    // We use a 7-day lookback window
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
    const now = Date.now()

    let recentArticlesCount = 0

    for (const post of allBlogs) {
      if (post.draft) continue

      // Use lastmod when available. Fallback to date only when lastmod is missing.
      const modifiedDate = new Date(post.lastmod || post.date).getTime()

      if (now - modifiedDate <= SEVEN_DAYS_MS) {
        urlsToSubmit.add(`${siteUrl}/blog/${post.slug}`)
        recentArticlesCount++
      }
    }

    const finalUrls = Array.from(urlsToSubmit)

    console.log(
      `[IndexNow] Discovered ${finalUrls.length} URLs to submit (including ${recentArticlesCount} recent articles).`
    )
    if (recentArticlesCount > 0) {
      console.log(`[IndexNow] Example URLs: \n  - ${finalUrls.slice(0, 3).join('\n  - ')}`)
    }

    // 5. Submit to IndexNow
    const result = await submitToIndexNow(finalUrls)

    if (result.ok) {
      console.log(`[IndexNow] ✅ Successfully submitted ${result.submitted} URLs to IndexNow.`)
    } else {
      console.warn(`[IndexNow] ⚠️ Submission failed: ${result.error}`)
    }
  } catch (err) {
    // IndexNow failures must NEVER break deployment
    console.warn(`[IndexNow] ⚠️ An error occurred during automated submission:`, err.message)
    console.warn(`[IndexNow] ⚠️ Deployment will continue normally.`)
  }
}
