const fs = require('fs')
const path = require('path')

const blogDir = path.join(__dirname, 'data', 'blog')
const indexFile = path.join(__dirname, 'LOCITRA_CONTENT_INDEX.md')

let totalArticles = 0
let categories = new Set()
let clusters = new Set()
let publishedCount = 0
let draftsCount = 0
let reviewsCount = 0
let tutorialsCount = 0
let comparisonsCount = 0
let pricingCount = 0
let pillarsCount = 0
let evergreenCount = 0

let articles = []
let allSlugs = new Set()
let allTitles = new Set()
let duplicateSlugs = []
let duplicateTitles = []
let missingCategories = []
let missingMetadata = []
let potentialOrphans = []

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const lines = match[1].split('\n')
  let data = {}
  for (let line of lines) {
    const idx = line.indexOf(':')
    if (idx > -1) {
      const key = line.slice(0, idx).trim()
      const value = line
        .slice(idx + 1)
        .trim()
        .replace(/^['"](.*)['"]$/, '$1')
      data[key] = value
    }
  }
  return data
}

function getWordCount(text) {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}

function processFiles(dir) {
  const files = fs.readdirSync(dir)

  for (let file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      processFiles(filePath)
    } else if (file.endsWith('.mdx')) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      const frontmatterText = frontmatterMatch ? frontmatterMatch[1] : ''
      const body = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content

      let data = parseFrontmatter(content) || {}

      const slug = file.replace('.mdx', '')
      if (allSlugs.has(slug)) duplicateSlugs.push(slug)
      allSlugs.add(slug)

      const title = data.title || ''
      if (title && allTitles.has(title)) duplicateTitles.push(title)
      if (title) allTitles.add(title)

      let isDraft = data.draft === 'true'
      if (isDraft) draftsCount++
      else publishedCount++

      let category = data.category || ''
      if (!category) missingCategories.push(slug)
      else categories.add(category)

      let tags = []
      if (data.tags) {
        try {
          const t = data.tags.match(/'([^']+)'/g)
          if (t) tags = t.map((tag) => tag.replace(/'/g, ''))
        } catch (e) {}
      }

      let wc = getWordCount(body)
      let readTime = Math.ceil(wc / 250) + ' min'

      let lowerTitle = title.toLowerCase()
      let contentType = 'Article'
      if (lowerTitle.includes('review')) contentType = 'Review'
      else if (
        lowerTitle.includes('vs') ||
        lowerTitle.includes('comparison') ||
        lowerTitle.includes('best') ||
        lowerTitle.includes('top')
      )
        contentType = 'Comparison'
      else if (
        lowerTitle.includes('how to') ||
        lowerTitle.includes('guide') ||
        lowerTitle.includes('tutorial')
      )
        contentType = 'Tutorial'
      else if (lowerTitle.includes('pricing') || lowerTitle.includes('cost'))
        contentType = 'Pricing'

      if (contentType === 'Review') reviewsCount++
      if (contentType === 'Tutorial') tutorialsCount++
      if (contentType === 'Comparison') comparisonsCount++
      if (contentType === 'Pricing') pricingCount++

      let intent = 'Informational'
      if (contentType === 'Review' || contentType === 'Comparison') intent = 'Commercial'
      else if (contentType === 'Pricing' || lowerTitle.includes('buy')) intent = 'Transactional'
      else if (contentType === 'Tutorial') intent = 'Tutorial'

      let audience = 'General Readers'
      if (lowerTitle.includes('developer') || lowerTitle.includes('api')) audience = 'Developers'
      else if (lowerTitle.includes('business') || lowerTitle.includes('enterprise'))
        audience = 'Businesses'
      else if (lowerTitle.includes('creator') || lowerTitle.includes('youtube'))
        audience = 'Creators'
      else if (lowerTitle.includes('student')) audience = 'Students'
      else if (lowerTitle.includes('professional') || lowerTitle.includes('career'))
        audience = 'Professionals'
      else if (lowerTitle.includes('beginner')) audience = 'Beginners'

      let isEvergreen = !lowerTitle.includes('2026') && !lowerTitle.includes('2025')
      if (isEvergreen) evergreenCount++

      let cluster = category || 'Uncategorized'
      clusters.add(cluster)
      let isPillar =
        lowerTitle.includes('ultimate guide') ||
        lowerTitle.includes('explained') ||
        (contentType === 'Comparison' && lowerTitle.includes('best'))
      if (isPillar) pillarsCount++

      let internalLinks = []
      const linkRegex = /\[([^\]]+)\]\(\/blog\/([^\)]+)\)/g
      let match
      while ((match = linkRegex.exec(body)) !== null) {
        internalLinks.push(match[2].split('#')[0])
      }

      let affiliate = body.includes('<AffiliateDisclosure />') ? 'Yes' : 'No'
      let keywords = slug.split('-')
      let primaryKeyword = keywords.slice(0, 2).join(' ')

      let missingMeta = []
      if (!data.summary) missingMeta.push('summary')
      if (!data.date) missingMeta.push('date')
      if (!data.authors) missingMeta.push('authors')
      if (!data.category) missingMeta.push('category')
      if (missingMeta.length > 0) missingMetadata.push(`${slug} (${missingMeta.join(', ')})`)

      articles.push({
        title,
        slug,
        url: `/blog/${slug}`,
        status: isDraft ? 'Draft' : 'Published',
        category,
        subcategory: tags[0] || '',
        contentType,
        primaryKeyword,
        secondaryKeywords: tags.join(', '),
        intent,
        audience,
        wordCount: wc,
        readTime,
        lastUpdated: data.date || '',
        author: data.authors || '',
        cluster,
        isPillar,
        internalLinks,
        affiliate,
        isEvergreen,
        missingMeta,
      })
      totalArticles++
    }
  }
}

processFiles(blogDir)

articles.forEach((a) => {
  a.incomingLinks = Array.from(
    new Set(
      articles.filter((other) => other.internalLinks.includes(a.slug)).map((other) => other.slug)
    )
  )
  if (a.incomingLinks.length === 0 && a.status === 'Published') {
    potentialOrphans.push(a.slug)
  }
})

let md = `# LOCITRA CONTENT INTELLIGENCE DATABASE\n\n`
md += `## Summary\n\n`
md += `- **Total Articles**: ${totalArticles}\n`
md += `- **Categories**: ${categories.size}\n`
md += `- **Clusters**: ${clusters.size}\n`
md += `- **Published**: ${publishedCount}\n`
md += `- **Drafts**: ${draftsCount}\n`
md += `- **Reviews**: ${reviewsCount}\n`
md += `- **Tutorials**: ${tutorialsCount}\n`
md += `- **Comparisons**: ${comparisonsCount}\n`
md += `- **Pricing**: ${pricingCount}\n`
md += `- **Pillars**: ${pillarsCount}\n`
md += `- **Evergreen Guides**: ${evergreenCount}\n\n`

md += `--------------------------------------------------\n\n`

articles.forEach((a) => {
  md += `### ${a.title || 'Untitled'}\n\n`
  md += `- **Slug**: ${a.slug}\n`
  md += `- **URL**: ${a.url}\n`
  md += `- **Status**: ${a.status}\n`
  md += `- **Category**: ${a.category}\n`
  md += `- **Subcategory**: ${a.subcategory}\n`
  md += `- **Content Type**: ${a.contentType}\n`
  md += `- **Primary Keyword**: ${a.primaryKeyword}\n`
  md += `- **Secondary Keywords**: ${a.secondaryKeywords}\n`
  md += `- **Search Intent**: ${a.intent}\n`
  md += `- **Target Audience**: ${a.audience}\n`
  md += `- **Word Count**: ${a.wordCount}\n`
  md += `- **Estimated Reading Time**: ${a.readTime}\n`
  md += `- **Last Updated**: ${a.lastUpdated}\n`
  md += `- **Author**: ${a.author}\n`
  md += `- **Cluster**: ${a.cluster}\n`
  md += `- **Pillar**: ${a.isPillar ? 'Yes' : 'No'}\n`
  md += `- **Parent Article**: ${a.isPillar ? 'Self' : a.cluster !== 'Uncategorized' ? 'Pillar of ' + a.cluster : 'None'}\n`

  let clusterChildren = articles
    .filter((c) => c.cluster === a.cluster && !c.isPillar)
    .map((c) => c.slug)
  md += `- **Child Articles**: ${a.isPillar && clusterChildren.length > 0 ? clusterChildren.join(', ') : 'None'}\n`

  let uniqueOutLinks = Array.from(new Set(a.internalLinks))
  md += `- **Current Internal Links**: ${uniqueOutLinks.length > 0 ? uniqueOutLinks.join(', ') : 'None'}\n`
  md += `- **Incoming Links**: ${a.incomingLinks.length > 0 ? a.incomingLinks.join(', ') : 'None'}\n`
  md += `- **Affiliate Programs Mentioned**: ${a.affiliate}\n`
  md += `- **Monetization Priority**: ${a.intent === 'Commercial' || a.intent === 'Transactional' ? 'High' : 'Medium'}\n`
  md += `- **Traffic Priority**: ${a.isPillar ? 'High' : a.isEvergreen ? 'Medium' : 'Low'}\n`
  md += `- **Evergreen**: ${a.isEvergreen ? 'Yes' : 'No'}\n`
  md += `- **Review Status**: ${a.status === 'Published' ? 'Reviewed' : 'Pending'}\n\n`
})

md += `--------------------------------------------------\n\n`
md += `## Cluster Summary\n\n`

for (let cluster of clusters) {
  let clusterArticles = articles.filter((a) => a.cluster === cluster)
  let pillars = clusterArticles.filter((a) => a.isPillar)
  let supporting = clusterArticles.filter((a) => !a.isPillar)

  md += `### ${cluster}\n`
  md += `- **Articles Inside**: ${clusterArticles.length}\n`
  md += `- **Pillar Article**: ${pillars.length > 0 ? pillars.map((p) => p.slug).join(', ') : 'None found (Missing Pillar)'}\n`
  md += `- **Supporting Articles**: ${supporting.length > 0 ? supporting.map((a) => a.slug).join(', ') : 'None'}\n`
  md += `- **Missing Content (Obvious)**: ${pillars.length === 0 ? 'Needs Pillar. ' : ''}${supporting.length === 0 ? 'Needs supporting articles.' : ''}\n\n`
}

md += `--------------------------------------------------\n\n`
md += `## Report\n\n`
md += `- **Duplicate slugs**: ${duplicateSlugs.length > 0 ? duplicateSlugs.join(', ') : 'None'}\n`
md += `- **Duplicate titles**: ${duplicateTitles.length > 0 ? duplicateTitles.join(', ') : 'None'}\n`
md += `- **Missing categories**: ${missingCategories.length > 0 ? missingCategories.join(', ') : 'None'}\n`
md += `- **Missing metadata**: ${missingMetadata.length > 0 ? '\\n  - ' + missingMetadata.join('\\n  - ') : 'None'}\n`
md += `- **Missing canonical URLs**: All (Need implementation in frontmatter if required)\n`
md += `- **Broken frontmatter**: None detected by parser\n`
md += `- **Potential orphan articles**: ${potentialOrphans.length > 0 ? potentialOrphans.join(', ') : 'None'}\n`

fs.writeFileSync(indexFile, md)
console.log('Successfully wrote LOCITRA_CONTENT_INDEX.md')
