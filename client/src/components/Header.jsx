import { AnimatePresence, motion } from 'framer-motion'
import { Home, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useScrollLock } from '../hooks/useUi'
import { NAV_LINKS } from '../content/site'

/** The wordmark: script word plus display caps, same move as the headlines. */
export function Wordmark({ className = '' }) {
  return (
    <span className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="u-script text-2xl leading-none">Luxury</span>
      <span className="u-display text-sm tracking-[0.24em] text-ivory">MUSIC SOUNDS</span>
    </span>
  )
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useScrollLock(isMenuOpen)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the drawer whenever navigation happens.
  useEffect(() => setIsMenuOpen(false), [location.pathname])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-ivory focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          isScrolled || isMenuOpen
            ? 'border-b border-ink-line bg-ink/92 backdrop-blur-md'
            : 'border-b border-transparent'
        }`}
      >
        <div className="shell flex h-20 items-center justify-between gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Deeper pages get an explicit way back. The wordmark links home
                too, but that is not obvious to everyone. */}
            {!isHome ? (
              <Link
                to="/"
                aria-label="Home"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-ink-line text-ivory-dim transition hover:border-gold-deep hover:text-gold-lift"
              >
                <Home size={15} strokeWidth={1.5} />
              </Link>
            ) : null}

            <Link to="/" aria-label="Luxury Music Sounds, home">
              <Wordmark />
            </Link>
          </div>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `u-meta transition-colors hover:text-gold-lift ${
                    isActive ? 'text-gold-lift' : ''
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/events" className="btn btn-buy btn-sm hidden sm:inline-flex">
              Book tickets
            </Link>

            <button
              type="button"
              className="grid size-11 place-items-center border border-ink-line text-ivory transition hover:border-gold-deep hover:text-gold-lift md:hidden"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X size={18} strokeWidth={1.5} />
              ) : (
                <Menu size={18} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            className="fixed inset-0 z-40 wash-royal pt-20 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav className="shell flex flex-col gap-2 pt-10" aria-label="Mobile">
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.4 }}
                >
                  <NavLink
                    to={link.to}
                    className="u-display block border-b border-ink-line py-5 text-4xl text-ivory"
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.4 }}
                className="pt-8"
              >
                <Link to="/events" className="btn btn-buy w-full">
                  Book tickets
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
