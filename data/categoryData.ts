/**
 * Single source of truth for Lochitra's 5 primary categories.
 *
 * Used by:
 * - app/categories/page.tsx       (index page)
 * - app/categories/[category]/    (detail pages)
 * - app/Main.tsx                  (homepage sections)
 * - data/headerNavLinks.ts        (navigation)
 * - components/Footer.tsx         (footer links)
 * - components/ArticleCard.tsx    (category badge colors)
 */

export interface Category {
  slug: string
  name: string
  icon: string
  description: string
  seoDescription: string
  /** Tailwind color token used for badge background/text — kept as a string
   *  so components can use template literals safely (avoids purge issues). */
  color: 'violet' | 'blue' | 'green' | 'amber' | 'rose'
}

export const CATEGORIES: Category[] = [
  {
    slug: 'ai-tools',
    name: 'AI Tools',
    icon: '🤖',
    color: 'violet',
    description: 'Reviews & guides for AI productivity',
    seoDescription:
      'Discover the best AI tools, apps, and workflows to boost your productivity. Honest reviews and step-by-step guides for beginners and professionals.',
  },
  {
    slug: 'technology',
    name: 'Technology',
    icon: '💻',
    color: 'blue',
    description: 'Trends shaping the digital world',
    seoDescription:
      'Stay informed on the technology trends shaping 2026 and beyond — from AI to quantum computing, edge computing, and sustainable tech.',
  },
  {
    slug: 'online-income',
    name: 'Online Income',
    icon: '💰',
    color: 'green',
    description: 'Strategies to earn online',
    seoDescription:
      'Practical, tested strategies to earn income online — freelancing, digital products, affiliate marketing, and content creation for beginners.',
  },
  {
    slug: 'career-growth',
    name: 'Career Growth',
    icon: '📈',
    color: 'amber',
    description: 'Level up your professional life',
    seoDescription:
      'Career growth strategies for the digital age — build skills, grow your network, use AI as a multiplier, and advance faster in your professional life.',
  },
  {
    slug: 'success-stories',
    name: 'Success Stories',
    icon: '⭐',
    color: 'rose',
    description: 'Real journeys, real results',
    seoDescription:
      'Inspiring real-world success stories from digital creators, freelancers, and entrepreneurs who built meaningful careers and income online.',
  },
]

/** Map from slug → Category for O(1) lookups */
export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
)

/** Tailwind class sets per color — defined statically so Tailwind includes them in the bundle */
export const CATEGORY_BADGE_CLASSES: Record<Category['color'], string> = {
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

export const CATEGORY_GRADIENT_CLASSES: Record<Category['color'], string> = {
  violet: 'from-violet-600 to-violet-800',
  blue: 'from-blue-600 to-blue-800',
  green: 'from-green-600 to-green-800',
  amber: 'from-amber-500 to-amber-700',
  rose: 'from-rose-500 to-rose-700',
}
