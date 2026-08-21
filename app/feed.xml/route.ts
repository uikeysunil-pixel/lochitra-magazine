import { allBlogs, Blog } from 'contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'
import { sortPosts } from 'pliny/utils/contentlayer.js'
import { escape } from 'pliny/utils/htmlEscaper.js'

export const dynamic = 'force-static'

const generateRssItem = (config: typeof siteMetadata, post: Blog) => `
  <item>
    <guid>${config.siteUrl}/blog/${post.slug}/</guid>
    <title>${escape(post.title)}</title>
    <link>${config.siteUrl}/blog/${post.slug}/</link>
    ${post.summary ? `<description>${escape(post.summary)}</description>` : ''}
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <author>${config.email} (${config.author})</author>
    ${post.tags && Array.isArray(post.tags) ? post.tags.map((t: string) => `<category>${t}</category>`).join('') : ''}
  </item>
`

const generateRss = (
  config: typeof siteMetadata,
  posts: Blog[],
  page = 'feed.xml'
) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(config.title)}</title>
    <link>${config.siteUrl}/blog/</link>
    <description>${escape(config.description)}</description>
    <language>${config.language}</language>
    <managingEditor>${config.email} (${config.author})</managingEditor>
    <webMaster>${config.email} (${config.author})</webMaster>
    <lastBuildDate>${posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${config.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
    ${posts.map((post) => generateRssItem(config, post)).join('')}
  </channel>
</rss>
`

export async function GET() {
  const publishPosts = allBlogs.filter((post) => post.draft !== true)
  const sortedPosts = sortPosts(publishPosts) as Blog[]
  const rss = generateRss(siteMetadata, sortedPosts)

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
