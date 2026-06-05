import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-gray-800">
      {/* ── Main footer body ────────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* ── Brand / About column (2 cols on lg) ──────────────── */}
            <div className="lg:col-span-2">
              <Link
                href="/"
                className="text-primary-600 dark:text-primary-400 mb-3 inline-block text-2xl font-extrabold tracking-tight"
              >
                Locitra
              </Link>
              <p className="mb-5 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Locitra is a modern blog covering AI tools, technology, online income opportunities,
                career growth, and success stories — written for curious minds who want to stay
                ahead.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-4">
                <SocialIcon kind="mail" href={`mailto:${siteMetadata.email}`} size={5} />
                {siteMetadata.linkedin && (
                  <SocialIcon kind="linkedin" href={siteMetadata.linkedin} size={5} />
                )}
                {siteMetadata.youtube && (
                  <SocialIcon kind="youtube" href={siteMetadata.youtube} size={5} />
                )}
                {siteMetadata.instagram && (
                  <SocialIcon kind="instagram" href={siteMetadata.instagram} size={5} />
                )}
                {siteMetadata.x && <SocialIcon kind="x" href={siteMetadata.x} size={5} />}
              </div>
            </div>

            {/* ── Categories ─────────────────────────────────────────── */}
            <div>
              <h3 className="mb-5 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
                Categories
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  { href: '/categories/ai-tools', label: '🤖 AI Tools' },
                  { href: '/categories/technology', label: '💻 Technology' },
                  { href: '/categories/online-income', label: '💰 Online Income' },
                  { href: '/categories/career-growth', label: '📈 Career Growth' },
                  { href: '/categories/success-stories', label: '🌟 Success Stories' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-500 transition-colors dark:text-gray-400"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Quick Links ────────────────────────────────────────── */}
            <div>
              <h3 className="mb-5 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
                Quick Links
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/blog', label: 'All Articles' },
                  { href: '/about', label: 'About Us' },
                  { href: '/editorial-policy', label: 'Editorial Policy' },
                  { href: '/privacy-policy', label: 'Privacy Policy' },
                  { href: '/terms', label: 'Terms & Conditions' },
                  { href: '/disclaimer', label: 'Disclaimer' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-500 transition-colors dark:text-gray-400"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Contact + Newsletter ────────────────────────────────── */}
            <div>
              <h3 className="mb-5 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
                Contact
              </h3>
              <ul className="mb-8 space-y-3 text-sm">
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-500 transition-colors dark:text-gray-400"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a
                    href={`mailto:${siteMetadata.email}`}
                    className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-500 transition-colors dark:text-gray-400"
                  >
                    {siteMetadata.email}
                  </a>
                </li>
              </ul>

              {/* Newsletter placeholder */}
              <div>
                <h4 className="mb-2 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
                  Newsletter
                </h4>
                <p className="mb-3 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                  Weekly insights on AI, tech & digital income — free.
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    disabled
                    aria-label="Newsletter email (coming soon)"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-400 placeholder-gray-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:placeholder-gray-600"
                  />
                  <button
                    disabled
                    className="from-primary-600 to-primary-700 w-full cursor-not-allowed rounded-lg bg-gradient-to-r px-3 py-2 text-xs font-semibold text-white opacity-60"
                  >
                    Subscribe — Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()}{' '}
            <Link
              href="/"
              className="hover:text-primary-600 dark:hover:text-primary-400 font-semibold text-gray-500 transition-colors dark:text-gray-400"
            >
              Locitra
            </Link>
            . All Rights Reserved. Made with ❤️ for curious minds.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <Link
              href="/privacy-policy"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/disclaimer"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Disclaimer
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/terms"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Terms
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/editorial-policy"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Editorial Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/contact"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
