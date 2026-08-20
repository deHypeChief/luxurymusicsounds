import {
  CalendarDays,
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ScanLine,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/adminAuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { Spinner } from '../States'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/door', label: 'Door check-in', icon: ScanLine },
  { to: '/admin/settings', label: 'Settings', icon: SlidersHorizontal },
]

export default function AdminLayout() {
  const { admin, ensureSession, isResolving, isSignedIn, signOut } = useAdminAuth()
  const location = useLocation()
  const [isNavOpen, setIsNavOpen] = useState(false)

  // Admin screens are the only place that needs to know who is signed in.
  useEffect(() => {
    ensureSession()
  }, [ensureSession])

  useEffect(() => setIsNavOpen(false), [location.pathname])

  if (isResolving) {
    return <Spinner label="Checking your session" className="min-h-[100svh]" />
  }

  if (!isSignedIn) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div className="min-h-[100svh] bg-ink lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-ink-line px-5 py-4 lg:hidden">
        <Link to="/admin" className="u-display text-sm tracking-[0.24em]">
          LMS ADMIN
        </Link>
        <button
          type="button"
          onClick={() => setIsNavOpen((open) => !open)}
          className="grid size-10 place-items-center border border-ink-line text-ivory-dim"
          aria-expanded={isNavOpen}
          aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
        >
          {isNavOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
        </button>
      </div>

      <aside
        className={`border-r border-ink-line bg-ink-raised lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:flex-col ${
          isNavOpen ? 'block' : 'hidden lg:block'
        }`}
      >
        <div className="hidden border-b border-ink-line px-6 py-6 lg:block">
          <Link to="/admin" className="block">
            <span className="u-script block text-2xl leading-none">Luxury</span>
            <span className="u-display mt-1 block text-[0.6875rem] tracking-[0.3em] text-ivory-dim">
              MUSIC SOUNDS
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Admin">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 font-sans text-sm tracking-wide transition-colors ${
                  isActive
                    ? 'bg-gold/12 text-gold-lift'
                    : 'text-ivory-dim hover:bg-ink-soft hover:text-ivory'
                }`
              }
            >
              <item.icon size={17} strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-line p-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-3 px-4 py-2.5 text-sm text-ivory-dim transition-colors hover:text-gold-lift"
          >
            <ExternalLink size={16} strokeWidth={1.5} />
            View the site
          </a>

          <div className="border border-ink-line p-4">
            <p className="truncate text-sm text-ivory">{admin?.name}</p>
            <p className="truncate text-xs text-ivory-faint">{admin?.email}</p>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-velvet-lift"
            >
              <LogOut size={13} strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 p-5 md:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  )
}

/** Shared page header for admin screens. Also names the browser tab. */
export function AdminHeader({ title, description, action, className = '' }) {
  useDocumentTitle(title ? `${title} · Admin` : null)

  return (
    <header
      className={`mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-ink-line pb-6 ${className}`}
    >
      <div>
        <h1 className="u-display text-3xl md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-sm text-ivory-dim">{description}</p> : null}
      </div>
      {action}
    </header>
  )
}
