import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 dark:border-gray-800">
      <div className="py-12">
        {/* Brand */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-primary-600 dark:text-primary-400 mb-2 inline-block text-2xl font-extrabold tracking-tight"
          >
            Lochitra
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {siteMetadata.description}
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {/* Explore */}
          <div>
            <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
              Explore
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/blog', label: 'All Articles' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
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

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
              Categories
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/categories/ai-tools', label: 'AI Tools' },
                { href: '/categories/technology', label: 'Technology' },
                { href: '/categories/online-income', label: 'Online Income' },
                { href: '/categories/career-growth', label: 'Career Growth' },
                { href: '/categories/success-stories', label: 'Success Stories' },
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

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
              Legal
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/privacy-policy', label: 'Privacy Policy' },
                { href: '/disclaimer', label: 'Disclaimer' },
                { href: '/contact', label: 'Contact' },
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
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-gray-200 pt-8 sm:flex-row sm:justify-between dark:border-gray-800">
          <div className="flex items-center space-x-4">
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Lochitra. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
