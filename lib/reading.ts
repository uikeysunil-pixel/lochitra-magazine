export function formatReadingTime(readingTimeText?: string, wordCount?: number): string {
  if (!readingTimeText) return ''
  if (!wordCount) return readingTimeText
  return `${readingTimeText} • ${wordCount.toLocaleString()} words`
}

export function shouldShowUpdateBadge(lastmod?: string, date?: string): boolean {
  if (!lastmod || !date) return false
  const updatedDate = new Date(lastmod).setHours(0, 0, 0, 0)
  const publishedDate = new Date(date).setHours(0, 0, 0, 0)
  return updatedDate > publishedDate
}

export function isRecentlyUpdated(lastmod?: string, date?: string, thresholdDays = 90): boolean {
  if (!shouldShowUpdateBadge(lastmod, date)) return false
  const updatedDate = new Date(lastmod as string).getTime()
  const now = new Date().getTime()
  const diffDays = (now - updatedDate) / (1000 * 3600 * 24)
  return diffDays <= thresholdDays
}

export function calculateReadingProgress(element: HTMLElement): number {
  if (!element) return 0

  const totalHeight = element.clientHeight - element.offsetTop - window.innerHeight
  const windowScrollTop =
    window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0

  if (windowScrollTop === 0) return 0
  if (windowScrollTop > totalHeight) return 100

  return (windowScrollTop / totalHeight) * 100
}
