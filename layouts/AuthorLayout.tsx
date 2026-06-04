import { ReactNode } from 'react'
import type { Authors } from 'contentlayer/generated'
import SocialIcon from '@/components/social-icons'
import Image from 'next/image'

interface Props {
  children: ReactNode
  content: Omit<Authors, '_id' | '_raw' | 'body'>
}

export default function AuthorLayout({ children, content }: Props) {
  const { name, avatar, occupation, company, email, twitter, bluesky, linkedin, github } = content

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            About
          </h1>
        </div>

        <div className="items-start space-y-2 xl:grid xl:grid-cols-3 xl:space-y-0 xl:gap-x-8">
          {/* ── Author Profile Card ──────────────────────────────────── */}
          <div className="flex flex-col pt-8">
            {/* Photo card */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
              {/* Gradient header band */}
              <div className="from-primary-600 h-24 w-full bg-gradient-to-br to-cyan-500" />

              {/* Avatar — overlaps the gradient band */}
              <div className="relative -mt-16 flex justify-center px-6">
                <div className="relative h-[120px] w-[120px] overflow-hidden rounded-2xl border-4 border-white shadow-lg sm:h-[140px] sm:w-[140px] dark:border-gray-900">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={`${name} — author photo`}
                      fill
                      sizes="(max-width: 640px) 120px, 140px"
                      className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      priority
                    />
                  ) : (
                    <div className="from-primary-600 flex h-full w-full items-center justify-center bg-gradient-to-br to-cyan-500 text-5xl text-white">
                      {name?.charAt(0) ?? 'A'}
                    </div>
                  )}
                </div>
              </div>

              {/* Identity */}
              <div className="px-6 pt-4 pb-6 text-center">
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {name}
                </h2>
                <p className="text-primary-600 dark:text-primary-400 mt-1 text-sm font-medium">
                  {occupation}
                </p>
                {company && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{company}</p>
                )}

                {/* Divider */}
                <div className="my-4 border-t border-gray-100 dark:border-gray-700/60" />

                {/* Social icons */}
                <div className="flex items-center justify-center gap-3">
                  <SocialIcon kind="mail" href={`mailto:${email}`} size={5} />
                  {github && <SocialIcon kind="github" href={github} size={5} />}
                  {linkedin && <SocialIcon kind="linkedin" href={linkedin} size={5} />}
                  {twitter && <SocialIcon kind="x" href={twitter} size={5} />}
                  {bluesky && <SocialIcon kind="bluesky" href={bluesky} size={5} />}
                </div>
              </div>
            </div>

            {/* Trust badges below card */}
            <div className="mt-4 grid grid-cols-3 divide-x divide-gray-200 rounded-xl border border-gray-200 bg-white py-3 text-center dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">AI</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tools</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Tech</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Trends</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Income</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Strategies</div>
              </div>
            </div>
          </div>

          {/* ── Bio content ─────────────────────────────────────────── */}
          <div className="prose dark:prose-invert max-w-none pt-8 pb-8 xl:col-span-2">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
