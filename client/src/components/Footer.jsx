import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { BRAND_ORDER, NAV_LINKS } from '../lib/site'
import { Wordmark } from './Header'
import { Script } from './Typography'

export default function Footer() {
  const settings = useSiteSettings()
  const year = new Date().getFullYear()

  const contact = settings?.contact

  /** Grouped by act, in the house's own order rather than alphabetically. */
  const grouped = useMemo(() => {
    const byBrand = new Map()
    for (const social of settings?.socials ?? []) {
      if (!byBrand.has(social.brand)) byBrand.set(social.brand, [])
      byBrand.get(social.brand).push(social)
    }

    return BRAND_ORDER.filter((brand) => byBrand.has(brand)).map((brand) => ({
      brand,
      links: byBrand.get(brand),
    }))
  }, [settings])

  const heading = settings?.footerHeading || 'Book the room'
  const headingWords = heading.trim().split(' ')
  const headingLead = headingWords.slice(0, -1).join(' ')
  const headingTail = headingWords[headingWords.length - 1]

  return (
    <footer className="border-t border-ink-line bg-ink">
      <div className="shell py-16 md:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="u-display text-[length:var(--text-display)]">
              {headingLead ? `${headingLead} ` : ''}
              <Script xl>{headingTail}</Script>
            </h2>

            {settings?.footerIntro ? (
              <p className="mt-6 max-w-md text-ivory-dim">{settings.footerIntro}</p>
            ) : null}

            {contact ? (
              <div className="mt-8 flex flex-col gap-3">
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="group flex w-fit items-center gap-3 text-ivory transition-colors hover:text-gold-lift"
                  >
                    <Mail size={16} strokeWidth={1.5} className="shrink-0 text-gold" />
                    {contact.email}
                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.5}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </a>
                ) : null}

                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className="flex w-fit items-center gap-3 text-ivory transition-colors hover:text-gold-lift"
                  >
                    <Phone size={16} strokeWidth={1.5} className="shrink-0 text-gold" />
                    {contact.phone}
                  </a>
                ) : null}

                {contact.city ? (
                  <p className="flex items-center gap-3 text-ivory-dim">
                    <MapPin size={16} strokeWidth={1.5} className="shrink-0 text-gold" />
                    {contact.city}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Socials grouped by act, because each one runs its own accounts. */}
          <div className="grid gap-10 sm:grid-cols-3">
            {grouped.map((group) => (
              <div key={group.brand}>
                <h3 className="u-eyebrow mb-4">{group.brand}</h3>
                <ul className="space-y-2">
                  {group.links.map((social) => (
                    <li key={social.id}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1.5 text-sm text-ivory-dim transition-colors hover:text-ivory"
                        title={social.handle || social.platform}
                      >
                        {social.platform}
                        <ArrowUpRight
                          size={12}
                          strokeWidth={1.5}
                          className="text-gold opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="u-rule my-12" />

        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <Link to="/" aria-label="Luxury Music Sounds, home">
            <Wordmark />
          </Link>

          <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="u-meta transition-colors hover:text-gold-lift"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-xs text-ivory-faint">
            © {year} Luxury Music Sounds. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
