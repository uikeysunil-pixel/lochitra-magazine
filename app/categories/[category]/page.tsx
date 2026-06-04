import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { genPageMetadata } from 'app/seo'
import CategoryListLayout from '@/layouts/CategoryListLayout'
import { CATEGORIES, CATEGORY_MAP } from '@/data/categoryData'

const POSTS_PER_PAGE = 9

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ category: cat.slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const params = await props.params
  const cat = CATEGORY_MAP[params.category]
  if (!cat) return {}

  return genPageMetadata({
    title: cat.name,
    description: cat.seoDescription,
    alternates: {
      canonical: `./`,
    },
  })
}

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const cat = CATEGORY_MAP[params.category]

  if (!cat) notFound()

  // Filter by the dedicated `category` field (not tags)
  const allCategoryPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) => !post.draft && post.category === cat.slug))
  )

  const totalPages = Math.ceil(allCategoryPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = allCategoryPosts.slice(0, POSTS_PER_PAGE)

  return (
    <CategoryListLayout
      posts={allCategoryPosts}
      category={cat}
      initialDisplayPosts={initialDisplayPosts}
      pagination={{ currentPage: 1, totalPages }}
    />
  )
}
