import { allAuthors, allBlogs, type Authors, type Blog } from 'contentlayer/generated'
import { CoreContent, coreContent } from 'pliny/utils/contentlayer'

const PRIMARY_AUTHOR_SLUG = 'sunil-kumar-uikey'

export function getAuthorBySlug(slug: string): Authors | undefined {
  return allAuthors.find((a) => a.slug === slug)
}

export function getPrimaryAuthor(): Authors | undefined {
  return getAuthorBySlug(PRIMARY_AUTHOR_SLUG)
}

export function getAuthorPosts(slug: string): CoreContent<Blog>[] {
  const posts = allBlogs.filter((post) => post.authors?.includes(slug))
  // Sort from newest to oldest
  return posts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(coreContent)
}

export function getAuthorStats(slug: string) {
  const posts = getAuthorPosts(slug)

  if (posts.length === 0) {
    return {
      totalArticles: 0,
      categoriesCovered: 0,
      firstPublishedDate: null,
      latestPublishedDate: null,
      estimatedTotalReadingTime: '0 min',
    }
  }

  const categories = new Set<string>()
  let totalWords = 0

  posts.forEach((post) => {
    if (post.category) categories.add(post.category)
    const readingTime = post.readingTime as unknown as { words?: number }
    if (readingTime && readingTime.words) {
      totalWords += readingTime.words
    }
  })

  // Approx 200 words per min
  const totalMins = Math.ceil(totalWords / 200)

  return {
    totalArticles: posts.length,
    categoriesCovered: categories.size,
    firstPublishedDate: posts[posts.length - 1].date,
    latestPublishedDate: posts[0].date,
    estimatedTotalReadingTime: `${totalMins} min`,
  }
}
