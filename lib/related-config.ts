export const SCORING_WEIGHTS = {
  TOPIC_CLUSTER: 100,
  HUB: 80,
  SHARED_TAGS_MAX: 50, // Scaled by overlap
  CATEGORY: 40,
  SOFTWARE_RELATIONSHIP: 30,
  FRESHNESS_MAX: 10,
}

// Determines the penalty applied to articles in the same category if we already have too many
export const DIVERSITY_PENALTY = 50

export const RECOMMENDATION_LIMITS = {
  MIN: 4,
  MAX: 6,
}
