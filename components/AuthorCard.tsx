import Image from 'next/image'
import SocialIcon from '@/components/social-icons'

interface AuthorCardProps {
  name: string
  avatar?: string
  occupation?: string
  /** Short bio — if omitted a default Lochitra bio is shown */
  bio?: string
  email?: string
  twitter?: string
  linkedin?: string
}

/**
 * Reusable author bio block displayed at the bottom of every article.
 *
 * Renders:
 *  - Circular avatar (with gradient fallback)
 *  - "Written by" label
 *  - Author name + verified badge + role
 *  - Short bio
 *  - Optional social icons
 *
 * Usage: PostLayout, standalone author pages, etc.
 */
export default function AuthorCard({
  name,
  avatar,
  occupation,
  bio,
  email,
  twitter,
  linkedin,
}: AuthorCardProps) {
  const defaultBio =
    'Sunil Kumar writes about AI tools, technology trends, online income opportunities, career growth, and digital success stories.'

  return (
    <aside
      aria-label={`About the author, ${name}`}
      className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Top accent bar */}
      <div
        className="from-primary-600 h-1 w-full bg-gradient-to-r to-cyan-500"
        aria-hidden="true"
      />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="ring-primary-200 dark:ring-primary-700 relative h-20 w-20 overflow-hidden rounded-full shadow-md ring-2 sm:h-24 sm:w-24">
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
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Label */}
            <p className="text-primary-600 dark:text-primary-400 mb-1.5 text-xs font-semibold tracking-widest uppercase">
              Written by
            </p>

            {/* Name + verified badge */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{name}</h3>
              <span
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                aria-label="Verified author"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            </div>

            {/* Role */}
            {occupation && (
              <p className="mt-0.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                {occupation}
              </p>
            )}

            {/* Bio */}
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {bio || defaultBio}
            </p>

            {/* Social links */}
            {(email || twitter || linkedin) && (
              <div className="mt-4 flex items-center gap-3">
                {email && <SocialIcon kind="mail" href={`mailto:${email}`} size={4} />}
                {linkedin && <SocialIcon kind="linkedin" href={linkedin} size={4} />}
                {twitter && <SocialIcon kind="x" href={twitter} size={4} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
