import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SearchButton from './SearchButton'

const Header = () => {
  let headerClass =
    'flex items-center w-full bg-white dark:bg-gray-950 justify-between py-4 border-b border-gray-100 dark:border-gray-800'
  if (siteMetadata.stickyNav) {
    headerClass += ' sticky top-0 z-50'
  }

  return (
    <header className={headerClass}>
      <Link href="/" aria-label={siteMetadata.headerTitle}>
        <div className="flex items-center gap-2">
          <Logo />
          {typeof siteMetadata.headerTitle === 'string' ? (
            <div className="text-primary-600 dark:text-primary-400 hidden text-xl font-extrabold tracking-tight sm:block">
              {siteMetadata.headerTitle}
            </div>
          ) : (
            siteMetadata.headerTitle
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop nav */}
        <nav className="no-scrollbar hidden items-center gap-x-1 overflow-x-auto sm:flex lg:gap-x-2">
          {headerNavLinks
            .filter((link) => link.href !== '/')
            .map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-950 dark:hover:text-primary-400 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap text-gray-700 transition-colors dark:text-gray-300"
              >
                {link.title}
              </Link>
            ))}
        </nav>

        <SearchButton />
        <ThemeSwitch />
        <MobileNav />
      </div>
    </header>
  )
}

export default Header
