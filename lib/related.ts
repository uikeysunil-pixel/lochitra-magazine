import type { Blog } from 'contentlayer/generated'
import { CoreContent } from 'pliny/utils/contentlayer'
import { SCORING_WEIGHTS, DIVERSITY_PENALTY, RECOMMENDATION_LIMITS } from './related-config'

export interface ScoredArticle {
  post: CoreContent<Blog>
  score: number
  reasons: string[]
}

/**
 * Main entry point to calculate related articles.
 */
export function calculateRelatedArticles(
  currentPost: Blog | CoreContent<Blog>,
  allPosts: CoreContent<Blog>[]
): CoreContent<Blog>[] {
  const candidates = allPosts.filter((p) => p.slug !== currentPost.slug && !p.draft)

  const scoredCandidates = candidates.map((candidate) => scoreArticle(candidate, currentPost))

  // Sort by score descending, then date descending for tie-breakers
  scoredCandidates.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime()
  })

  const finalRecommendations = selectDiverseRecommendations(scoredCandidates)

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n=== Recommendation Score Breakdown for [${currentPost.slug}] ===`)
    scoredCandidates.slice(0, 10).forEach((c, index) => {
      console.log(`${index + 1}. ${c.post.slug}`)
      console.log(`   Score: ${c.score}`)
      console.log(`   Reasons: ${c.reasons.join(', ')}`)
    })
    console.log('==============================================================\n')
  }

  // Strip out the scoring wrapper and just return the posts
  return finalRecommendations.map((r) => r.post)
}

/**
 * Scores a candidate article against the current article.
 */
export function scoreArticle(
  candidate: CoreContent<Blog>,
  currentPost: Blog | CoreContent<Blog>
): ScoredArticle {
  let score = 0
  const reasons: string[] = []

  // 1. Topic Cluster (Tier 1)
  if (detectTopicCluster(candidate, currentPost)) {
    score += SCORING_WEIGHTS.TOPIC_CLUSTER
    reasons.push('Same topic cluster (shared category + >=2 tags)')
  }
  // 2. Category Match (Tier 2) - Apply only if not already counted as Topic Cluster
  else if (detectCategoryMatch(candidate, currentPost)) {
    score += SCORING_WEIGHTS.CATEGORY
    reasons.push('Same category')
  }

  // 3. Tag Similarity (Tier 3)
  const tagPoints = calculateTagWeight(candidate, currentPost)
  if (tagPoints > 0) {
    score += tagPoints
    reasons.push(`Shared tags (+${tagPoints} pts)`)
  }

  // 4. Hub Relationship (Level 2)
  if (detectHubRelationship(candidate, currentPost)) {
    score += SCORING_WEIGHTS.HUB
    reasons.push('Hub relationship')
  }

  // 5. Software Relationship (Level 5)
  if (detectSoftwareRelationship(candidate, currentPost)) {
    score += SCORING_WEIGHTS.SOFTWARE_RELATIONSHIP
    reasons.push('Software relationship')
  }

  // 6. Freshness (Level 6)
  const freshnessPoints = calculateFreshness(candidate)
  if (freshnessPoints > 0) {
    score += freshnessPoints
    reasons.push(`Freshness (+${freshnessPoints} pts)`)
  }

  return { post: candidate, score, reasons }
}

/**
 * Detect Topic Cluster: Same category AND 2 or more shared tags (or explicit cluster).
 */
function detectTopicCluster(a: CoreContent<Blog>, b: Blog | CoreContent<Blog>): boolean {
  if (!a.category || !b.category || a.category !== b.category) return false

  const tagsA = new Set((a.tags || []).map((t) => t.toLowerCase()))
  const tagsB = (b.tags || []).map((t) => t.toLowerCase())
  let sharedCount = 0

  for (const t of tagsB) {
    if (tagsA.has(t)) sharedCount++
  }

  return sharedCount >= 2
}

/**
 * Exact Category Match.
 */
function detectCategoryMatch(a: CoreContent<Blog>, b: Blog | CoreContent<Blog>): boolean {
  return !!(a.category && b.category && a.category === b.category)
}

/**
 * Calculate Tag Weight based on overlap.
 */
function calculateTagWeight(a: CoreContent<Blog>, b: Blog | CoreContent<Blog>): number {
  const tagsA = new Set((a.tags || []).map((t) => t.toLowerCase()))
  const tagsB = (b.tags || []).map((t) => t.toLowerCase())
  let sharedCount = 0

  for (const t of tagsB) {
    if (tagsA.has(t)) sharedCount++
  }

  // Max out at SHARED_TAGS_MAX
  return Math.min(sharedCount * 10, SCORING_WEIGHTS.SHARED_TAGS_MAX)
}

/**
 * Detect Hub Relationship:
 * Checks isHub/hubSlug frontmatter or title heuristics.
 */
function detectHubRelationship(a: CoreContent<Blog>, b: Blog | CoreContent<Blog>): boolean {
  // Check explicit frontmatter
  if (a.isHub && b.hubSlug === a.slug) return true
  if (b.isHub && a.hubSlug === b.slug) return true

  // Fallback to title heuristics for hub detection
  const hubKeywords = ['best', 'guide', 'top', 'comparison']
  const titleA = a.title.toLowerCase()
  const titleB = b.title.toLowerCase()

  const aIsHub = hubKeywords.some((k) => titleA.includes(k))
  const bIsHub = hubKeywords.some((k) => titleB.includes(k))

  // If one is a hub and they share a category or tag, consider it a hub relationship
  if (aIsHub || bIsHub) {
    if (detectCategoryMatch(a, b) || calculateTagWeight(a, b) >= 10) {
      return true
    }
  }

  return false
}

/**
 * Detect Software Relationship:
 * Both have a review field or are software reviews.
 */
function detectSoftwareRelationship(a: CoreContent<Blog>, b: Blog | CoreContent<Blog>): boolean {
  if (a.review && b.review) {
    // If they are both software reviews, and they share a category or tag, they are related software.
    return detectCategoryMatch(a, b) || calculateTagWeight(a, b) > 0
  }
  return false
}

/**
 * Calculate Freshness:
 * Recent articles get a slight boost up to FRESHNESS_MAX.
 */
function calculateFreshness(a: CoreContent<Blog>): number {
  const dateStr = a.lastmod || a.date
  if (!dateStr) return 0

  const date = new Date(dateStr)
  const now = new Date()
  const ageMs = now.getTime() - date.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)

  // Under 30 days = max points. 1 year = 0 points.
  if (ageDays <= 30) return SCORING_WEIGHTS.FRESHNESS_MAX
  if (ageDays > 365) return 0

  const decay = 1 - (ageDays - 30) / 335
  return Math.round(decay * SCORING_WEIGHTS.FRESHNESS_MAX)
}

/**
 * Select Diverse Recommendations.
 * Implements logic to not show 6 identical articles.
 */
function selectDiverseRecommendations(scored: ScoredArticle[]): ScoredArticle[] {
  const limit = RECOMMENDATION_LIMITS.MAX
  const selected: ScoredArticle[] = []

  // Clone the array so we can mutate scores during selection
  const pool = [...scored].filter((c) => c.score > 0)

  while (selected.length < limit && pool.length > 0) {
    // Re-sort the pool to ensure the highest score is first
    pool.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime()
    })

    // Take the best candidate
    const best = pool.shift()!
    selected.push(best)

    // Penalize remaining candidates in the same category
    const cat = best.post.category
    if (cat) {
      // Count how many we have of this category in selected
      const count = selected.filter((s) => s.post.category === cat).length

      // If we have 2 or more of the same category, heavily penalize the rest of that category
      if (count >= 2) {
        pool.forEach((candidate) => {
          if (candidate.post.category === cat) {
            candidate.score -= DIVERSITY_PENALTY
            candidate.reasons.push(`Diversity penalty (-${DIVERSITY_PENALTY} pts)`)
          }
        })
      }
    }
  }

  return selected
}
