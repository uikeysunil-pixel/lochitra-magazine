import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import CategoryListLayout from '@/layouts/CategoryListLayout'
import { CATEGORIES, CATEGORY_MAP } from '@/data/categoryData'

import { Metadata } from 'next'
import { genPageMetadata } from 'app/seo'

const POSTS_PER_PAGE = 9

export async function generateMetadata(props: {
  params: Promise<{ category: string; page: string }>
}): Promise<Metadata> {
  const params = await props.params
  const cat = CATEGORY_MAP[params.category]
  if (!cat) return {}

  const pageNumber = params.page
  return genPageMetadata({
    title: `${cat.name} - Page ${pageNumber}`,
    description: `Browse page ${pageNumber} of ${cat.name} articles and resources on Locitra.`,
    canonicalPath: `/categories/${params.category}/page/${pageNumber}`,
  })
}

export const dynamicParams = false

export const generateStaticParams = async () => {
  return CATEGORIES.flatMap((cat) => {
    const allCategoryPosts = allBlogs.filter((post) => !post.draft && post.category === cat.slug)
    const totalPages = Math.max(1, Math.ceil(allCategoryPosts.length / POSTS_PER_PAGE))
    return Array.from({ length: totalPages }, (_, i) => ({
      category: cat.slug,
      page: (i + 1).toString(),
    }))
  })
}

export default async function CategoryPaginationPage(props: {
  params: Promise<{ category: string; page: string }>
}) {
  const params = await props.params
  const cat = CATEGORY_MAP[params.category]

  if (!cat) notFound()

  const allCategoryPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) => !post.draft && post.category === cat.slug))
  )

  const pageNumber = parseInt(params.page)
  const totalPages = Math.ceil(allCategoryPosts.length / POSTS_PER_PAGE)

  // Return 404 for invalid page numbers or empty pages
  if (pageNumber <= 0 || pageNumber > totalPages || isNaN(pageNumber)) {
    return notFound()
  }

  const initialDisplayPosts = allCategoryPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

  return (
    <CategoryListLayout
      posts={allCategoryPosts}
      category={cat}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
    />
  )
}
