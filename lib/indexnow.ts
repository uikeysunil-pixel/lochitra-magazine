/**
 * IndexNow submission utility for Locitra
 * ────────────────────────────────────────
 * IndexNow lets search engines (Bing, Yandex, etc.) know about new or updated
 * URLs instantly, without waiting for the next crawl cycle.
 *
 * Key file: https://locitra.com/ad4703f4d7314cefb4f019617a45d45e.txt
 * API spec:  https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = 'ad4703f4d7314cefb4f019617a45d45e'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
 * Resolve the canonical site URL.
 * Priority: NEXT_PUBLIC_SITE_URL env var → hardcoded fallback.
 * Trailing slash is always stripped.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://locitra.com'
}

export interface IndexNowResult {
  ok: boolean
  status?: number
  submitted: number
  urls: string[]
  error?: string
}

/**
 * Submit one or more URLs to IndexNow.
 *
 * @param urls - Array of absolute URLs to submit. Must belong to the same host.
 * @returns    - Result object with ok flag, HTTP status, submitted count, and urls.
 *
 * @example
 * // Submit the homepage
 * const result = await submitToIndexNow(['https://locitra.com/'])
 *
 * @example
 * // Submit a new blog post
 * const result = await submitToIndexNow([
 *   'https://locitra.com/blog/my-new-post',
 * ])
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (!urls || urls.length === 0) {
    return { ok: false, submitted: 0, urls: [], error: 'No URLs provided' }
  }

  const siteUrl = getSiteUrl()
  const host = new URL(siteUrl).host

  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    })

    // IndexNow returns 200 (OK) or 202 (Accepted) on success.
    // 422 = invalid URL list, 429 = rate limited, 400 = bad request.
    const ok = response.status === 200 || response.status === 202

    return {
      ok,
      status: response.status,
      submitted: ok ? urls.length : 0,
      urls,
      ...(!ok && { error: `IndexNow API returned HTTP ${response.status}` }),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      submitted: 0,
      urls,
      error: `Fetch failed: ${message}`,
    }
  }
}
