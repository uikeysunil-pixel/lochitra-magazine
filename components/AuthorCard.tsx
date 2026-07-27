import Image from 'next/image'
import Link from '@/components/Link'
import SocialIcon from '@/components/social-icons'

interface AuthorCardProps {
  name: string
  slug?: string
  avatar?: string
  occupation?: string
  /** Short bio — if omitted a default Locitra bio is shown */
  bio?: string
  email?: string
  twitter?: string
  linkedin?: string
  bluesky?: string
  github?: string
  expertise?: string[]
  yearsExperience?: string
  certifications?: string[]
}

const CONCISE_DEFAULT_BIO =
  'Sunil Kumar Uikey is the Founder and Editor-in-Chief of Locitra, dedicated to publishing practical, evidence-based guides for digital professionals and creators. With over a decade of hands-on experience in artificial intelligence, software evaluation, and digital strategy, Sunil cuts through market hype to deliver actionable insights. He systematically tests emerging AI tools, productivity platforms, cybersecurity software, and online business models to ensure every guide is grounded in real-world utility, strict commercial independence, and rigorous verification.'

function formatCardBio(rawBio?: string): string {
  if (!rawBio) return CONCISE_DEFAULT_BIO

  // Remove decorative stars, markdown headers/formatting
  const cleaned = rawBio
    .replace(/★/g, '')
    .replace(/^[#*-\s]+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim()

  // Extract the lead paragraph
  const firstParagraph = cleaned.split('\n\n')[0] || cleaned
  const words = firstParagraph.split(/\s+/)
  if (words.length > 115) {
    return words.slice(0, 115).join(' ') + '...'
  }
  return firstParagraph || CONCISE_DEFAULT_BIO
}

/**
 * Premium editorial author bio block displayed at the bottom of every Locitra article.
 * Final Editorial Polish: 110-word bio optimization, subtle blue accent chips, micro-typography, and compact mobile rhythm.
 */
export default function AuthorCard({
  name,
  slug,
  avatar,
  occupation,
  bio,
  email,
  twitter,
  linkedin,
  bluesky,
  github,
  expertise,
  yearsExperience,
  certifications,
}: AuthorCardProps) {
  const expertiseAreas = expertise || []
  const isVerified = certifications?.includes('Verified Author') || name === 'Sunil Kumar Uikey'
  const authorSlug = slug || name.toLowerCase().replace(/\s+/g, '-')
  const displayBio = formatCardBio(bio)

  return (
    <aside
      aria-label={`About the author, ${name}`}
      className="mt-12 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900/90"
    >
      {/* Top accent gradient bar */}
      <div
        className="from-primary-600 h-1.5 w-full bg-gradient-to-r via-blue-500 to-cyan-400"
        aria-hidden="true"
      />

      <div className="p-6 sm:p-7">
        {/* Label */}
        <p className="text-primary-600 dark:text-primary-400 mb-3.5 text-[10px] font-bold tracking-[0.18em] uppercase">
          About the Author
        </p>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* Avatar column */}
          <div className="flex-shrink-0">
            <Link
              href={`/author/${authorSlug}`}
              className="group block"
              aria-label={`View ${name}'s full editorial profile`}
            >
              <div className="ring-primary-200 dark:ring-primary-800 relative h-20 w-20 overflow-hidden rounded-2xl shadow-md ring-2 transition-transform group-hover:scale-105 sm:h-24 sm:w-24">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={`${name} — author photo`}
                    fill
                    sizes="96px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="from-primary-600 flex h-full w-full items-center justify-center bg-gradient-to-br to-cyan-500 text-3xl font-bold text-white">
                    {name?.charAt(0) ?? 'A'}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Content column */}
          <div className="min-w-0 flex-1">
            {/* Header: Name + Verified Badge */}
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold text-gray-900 sm:text-xl dark:text-gray-100">
                <Link
                  href={`/author/${authorSlug}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {name}
                </Link>
              </h3>
              {isVerified && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200/80 bg-blue-50/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                  aria-label="Verified author badge"
                >
                  <svg
                    className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Author
                </span>
              )}
            </div>

            {/* Role & Experience */}
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {occupation || 'Founder & Editor-in-Chief'}
              {yearsExperience && ` · ${yearsExperience} Experience`}
            </p>

            {/* Expertise tags */}
            {expertiseAreas.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {expertiseAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/70 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            {/* Bio text */}
            <p className="text-xs leading-relaxed text-gray-600 sm:text-sm dark:text-gray-300">
              {displayBio}
            </p>

            {/* Read Full Author Profile Link */}
            <div className="mt-3">
              <Link
                href={`/author/${authorSlug}`}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1 text-xs font-bold transition-colors hover:underline"
              >
                <span>Read Full Author Profile</span>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>

            {/* Social links bar */}
            {(email || twitter || linkedin || github || bluesky) && (
              <div className="mt-3.5 flex items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800/80">
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  Follow:
                </span>
                {email && <SocialIcon kind="mail" href={`mailto:${email}`} size={4} />}
                {linkedin && <SocialIcon kind="linkedin" href={linkedin} size={4} />}
                {twitter && <SocialIcon kind="x" href={twitter} size={4} />}
                {github && <SocialIcon kind="github" href={github} size={4} />}
                {bluesky && <SocialIcon kind="bluesky" href={bluesky} size={4} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
