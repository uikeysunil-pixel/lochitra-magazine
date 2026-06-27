import { defineDocumentType, defineNestedType, ComputedFields, makeSource } from 'contentlayer2/source-files'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import readingTime from 'reading-time'
import { slug } from 'github-slugger'
import path from 'path'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkAlert } from 'remark-github-blockquote-alert'
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  remarkImgToJsx,
  extractTocHeadings,
} from 'pliny/mdx-plugins/index.js'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeKatexNoTranslate from 'rehype-katex-notranslate'
import rehypeCitation from 'rehype-citation'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'
import siteMetadata from './data/siteMetadata'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer.js'
import prettier from 'prettier'

const root = process.cwd()
const isProduction = process.env.NODE_ENV === 'production'

// heroicon mini link
const icon = fromHtmlIsomorphic(
  `
  <span class="content-header-link">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
  </svg>
  </span>
`,
  { fragment: true }
)

const computedFields: ComputedFields = {
  readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) },
  slug: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath.replace(/^.+?(\/)/, ''),
  },
  path: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath,
  },
  filePath: {
    type: 'string',
    resolve: (doc) => doc._raw.sourceFilePath,
  },
  toc: { type: 'json', resolve: (doc) => extractTocHeadings(doc.body.raw) },
}

/**
 * Count the occurrences of all tags across blog posts and write to json file
 */
async function createTagCount(allBlogs) {
  const tagCount: Record<string, number> = {}
  allBlogs.forEach((file) => {
    if (file.tags && (!isProduction || file.draft !== true)) {
      file.tags.forEach((tag) => {
        const formattedTag = slug(tag)
        if (formattedTag in tagCount) {
          tagCount[formattedTag] += 1
        } else {
          tagCount[formattedTag] = 1
        }
      })
    }
  })
  const formatted = await prettier.format(JSON.stringify(tagCount, null, 2), { parser: 'json' })
  const tagDataPath = './app/tag-data.json'
  let write = true
  if (existsSync(tagDataPath)) {
    const current = readFileSync(tagDataPath, 'utf8')
    if (current === formatted) {
      write = false
    }
  }
  if (write) {
    writeFileSync(tagDataPath, formatted)
  }
}

function createSearchIndex(allBlogs) {
  if (
    siteMetadata?.search?.provider === 'kbar' &&
    siteMetadata.search.kbarConfig.searchDocumentsPath
  ) {
    const searchPath = `public/${path.basename(siteMetadata.search.kbarConfig.searchDocumentsPath)}`
    const newContent = JSON.stringify(allCoreContent(sortPosts(allBlogs)))
    let write = true
    if (existsSync(searchPath)) {
      const current = readFileSync(searchPath, 'utf8')
      if (current === newContent) {
        write = false
      }
    }
    if (write) {
      writeFileSync(searchPath, newContent)
      console.log('Local search index generated...')
    }
  }
}
export const PricingData = defineNestedType(() => ({
  name: 'PricingData',
  fields: {
    model: { type: 'string' },
    startingPrice: { type: 'number' },
    currency: { type: 'string' },
    freePlan: { type: 'boolean' },
  },
}))

export const ReviewData = defineNestedType(() => ({
  name: 'ReviewData',
  fields: {
    productName: { type: 'string', required: true },
    reviewRating: { type: 'number', required: true },
    developer: { type: 'string' },
    officialWebsite: { type: 'string' },
    applicationCategory: { type: 'string' },
    operatingSystem: { type: 'string' },
    price: { type: 'string' },
    pricingModel: { type: 'string' },
    currentVersion: { type: 'string' },
    reviewSummary: { type: 'string' },
    pros: { type: 'list', of: { type: 'string' } },
    cons: { type: 'list', of: { type: 'string' } },
    testedVersion: { type: 'string' },
    lastTested: { type: 'string' },
    reviewedBy: { type: 'string' },
    recommendedFor: { type: 'string' },
    alternatives: { type: 'list', of: { type: 'string' } },
    affiliateLink: { type: 'string' },
    shortName: { type: 'string' },
    logo: { type: 'string' },
    screenshots: { type: 'list', of: { type: 'string' } },
    primaryCategory: { type: 'string' },
    supportedPlatforms: { type: 'list', of: { type: 'string' } },
    website: { type: 'string' },
    freeTrial: { type: 'boolean' },
    pricing: { type: 'nested', of: PricingData },
    releaseDate: { type: 'string' },
    lastUpdated: { type: 'string' },
    editorChoice: { type: 'boolean' },
    featured: { type: 'boolean' },
    verificationStatus: { type: 'string' },
  },
}))

export const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: 'blog/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, default: [] },
    lastmod: { type: 'date' },
    draft: { type: 'boolean' },
    summary: { type: 'string' },
    images: { type: 'json' },
    authors: { type: 'list', of: { type: 'string' } },
    layout: { type: 'string' },
    bibliography: { type: 'string' },
    canonicalUrl: { type: 'string' },
    /** Primary category slug — one per article (separate from keyword tags) */
    category: { type: 'string' },
    /** URL to a featured/hero image for this article */
    featuredImage: { type: 'string' },
    review: { type: 'nested', of: ReviewData },
    isHub: { type: 'boolean' },
    hubSlug: { type: 'string' },
  },
  computedFields: {
    ...computedFields,
  },
}))

export const Authors = defineDocumentType(() => ({
  name: 'Authors',
  filePathPattern: 'authors/**/*.mdx',
  contentType: 'mdx',
  fields: {
    name: { type: 'string', required: true },
    avatar: { type: 'string' },
    occupation: { type: 'string' },
    company: { type: 'string' },
    email: { type: 'string' },
    twitter: { type: 'string' },
    bluesky: { type: 'string' },
    linkedin: { type: 'string' },
    github: { type: 'string' },
    layout: { type: 'string' },
    expertise: { type: 'list', of: { type: 'string' } },
    yearsExperience: { type: 'string' },
    specialties: { type: 'list', of: { type: 'string' } },
    certifications: { type: 'list', of: { type: 'string' } },
    featuredQuote: { type: 'string' },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: 'data',
  documentTypes: [Blog, Authors],
  mdx: {
    cwd: process.cwd(),
    remarkPlugins: [
      remarkExtractFrontmatter,
      remarkGfm,
      remarkCodeTitles,
      remarkMath,
      remarkImgToJsx,
      remarkAlert,
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          headingProperties: {
            className: ['content-header'],
          },
          content: icon,
        },
      ],
      rehypeKatex,
      rehypeKatexNoTranslate,
      [rehypeCitation, { path: path.join(root, 'data') }],
      [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
      rehypePresetMinify,
    ],
  },
  onSuccess: async (importData) => {
    const { allBlogs } = await importData()
    createTagCount(allBlogs)
    createSearchIndex(allBlogs)
  },
})
