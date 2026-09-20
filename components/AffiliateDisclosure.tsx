/**
 * AffiliateDisclosure
 * ──────────────────────────────────────────────────────────────────────────────
 * Affiliate disclosure component for Locitra.
 * Outlines commercial transparency and editorial research methodology.
 *
 * Usage in MDX:
 *   <AffiliateDisclosure />
 *
 * Or with custom reviewer name:
 *   <AffiliateDisclosure reviewedBy="Sunil Kumar Uikey" />
 */

import Link from '@/components/Link'

interface AffiliateDisclosureProps {
  /** Optional override for the reviewer name (defaults to site author) */
  reviewedBy?: string
  /** Optional: show or hide the "Reviewed by" line (default: true) */
  showReviewer?: boolean
}

export default function AffiliateDisclosure({
  reviewedBy = 'Sunil Kumar Uikey',
  showReviewer = true,
}: AffiliateDisclosureProps) {
  return (
    <div
      role="note"
      aria-label="Affiliate disclosure"
      className="not-prose mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300"
    >
      {/* Icon */}
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Text */}
      <div className="leading-relaxed">
        <span className="font-semibold">Disclosure:</span> This article may contain affiliate links.
        If you purchase through our links, we may earn a referral commission at no additional cost
        to you. Recommendations are based on editorial research, vendor documentation, and objective
        evaluation criteria.{' '}
        <Link
          href="/disclaimer"
          className="underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-200"
          aria-label="Read our full disclaimer and affiliate policy"
        >
          Learn more
        </Link>
        .

      </div>
    </div>
  )
}
