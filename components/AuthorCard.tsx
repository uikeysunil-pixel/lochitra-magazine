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

/**
 * Premium author bio block displayed at the bottom of every article.
 * Includes: avatar, "Written by" label, name, verified badge, role,
 * expertise tags, bio, social links.
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
  const defaultBio =
    'Sunil Kumar Uikey writes about AI tools, technology trends, online income opportunities, career growth, and digital success stories. With years of experience in the digital space, he helps readers navigate the fast-changing world of technology and build meaningful careers online.'

  const expertiseAreas = expertise || []
  const verifiedBadge = certifications?.includes('Verified Author') || name === 'Sunil Kumar Uikey'

  return (
    <aside
      aria-label={`About the author, ${name}`}
      className="mt-14 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Top accent gradient bar */}
      <div
        className="from-primary-600 h-1.5 w-full bg-gradient-to-r via-blue-500 to-cyan-400"
        aria-hidden="true"
      />

      <div className="p-7 sm:p-9">
        {/* Label */}
        <p className="text-primary-600 dark:text-primary-400 mb-5 text-[10px] font-bold tracking-[0.18em] uppercase">
          About the Author
        </p>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Avatar column */}
          <div className="flex-shrink-0">
            {slug ? (
              <Link href={`/author/${slug}`}>
                <div className="ring-primary-200 dark:ring-primary-700 relative h-24 w-24 overflow-hidden rounded-2xl shadow-lg ring-2 transition-transform hover:scale-105 sm:h-28 sm:w-28">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={`${name} — author photo`}
                      fill
                      sizes="112px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="from-primary-600 flex h-full w-full items-center justify-center bg-gradient-to-br to-cyan-500 text-4xl font-bold text-white">
                      {name?.charAt(0) ?? 'A'}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="ring-primary-200 dark:ring-primary-700 relative h-24 w-24 overflow-hidden rounded-2xl shadow-lg ring-2 sm:h-28 sm:w-28">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={`${name} — author photo`}
                    fill
                    sizes="112px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="from-primary-600 flex h-full w-full items-center justify-center bg-gradient-to-br to-cyan-500 text-4xl font-bold text-white">
                    {name?.charAt(0) ?? 'A'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content column */}
          <div className="min-w-0 flex-1">
            {/* Name + verified badge */}
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                {slug ? (
                  <Link href={`/author/${slug}`} className="hover:underline">
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </h3>
              {verifiedBadge && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  aria-label="Verified author"
                >
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            {/* Role */}
            <p className="mb-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
              {occupation || 'Author, Locitra'} {yearsExperience && `· ${yearsExperience} Exp`}
            </p>

            {/* Expertise tags */}
            {expertiseAreas.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {expertiseAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {bio || defaultBio}
            </p>

            {/* Social links */}
            {(email || twitter || linkedin || github || bluesky) && (
              <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <span className="text-xs text-gray-400 dark:text-gray-500">Follow:</span>
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
