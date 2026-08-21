import { ArrowUpRight, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { Movement, Script } from '../components/Typography'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ACCENT_CLASSES } from '../lib/format'
import { BRAND_PROFILES, CONTACT, FOUNDER, socialsFor } from '../content/site'

// Deliberately not the home page hero, which uses ensemble-on-stage.jpg.
const HERO_IMAGE = '/media/four-seasons/quintet-candlelight.jpg'

export default function About() {
  useDocumentTitle('About')

  const contact = CONTACT
  // Split the address so a narrow screen can break it at the @ rather than
  // somewhere arbitrary inside the domain.
  const [emailUser, emailDomain] = (contact?.email ?? '').split('@')

  return (
    <>
      <header className="relative grain min-h-[70svh] overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="scrim absolute inset-0" />

        <div className="shell relative flex min-h-[70svh] flex-col justify-end pb-14 pt-36">
          <Reveal>
            <p className="u-eyebrow">About the house</p>
            <h1 className="u-display mt-5 max-w-4xl text-[length:var(--text-hero)]">
              We build the <Script xl>silence</Script> too
            </h1>

            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#enquiries" className="btn btn-buy">
                <Mail size={15} strokeWidth={1.5} />
                Make an enquiry
              </a>
              <Link to="/events" className="btn btn-ghost">
                See what is on
              </Link>
            </div>
          </Reveal>
        </div>
      </header>

      {/* What we do */}
      <section className="shell py-20 md:py-28">
        <Reveal>
          <Movement label="What we do" />
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="u-display text-[length:var(--text-display)]">
              A live-music house, not a booking <Script xl>agency</Script>
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="space-y-5 text-lg leading-relaxed text-ivory-dim">
            <p>
              Luxury Music Sounds puts live musicians in rooms where the music is the point.
              Weddings and private dinners, corporate evenings, concert programmes, and the
              black-tie galas that close each season.
            </p>
            <p>
              We are not a directory of players for hire. The same people rehearse together
              all year, which is why a Four Seasons programme sounds like an ensemble rather
              than a collection of diaries that happened to align.
            </p>
            <p>
              Everything is planned around one thing: how close we can get an audience to the
              sound before it stops being comfortable.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Founder, on the one ivory section */}
      <section className="intermission py-20 md:py-28">
        <div className="shell">
          <Reveal>
            <Movement label="The founder" />
          </Reveal>

          <div className="mt-12 grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <Reveal>
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={FOUNDER.portrait}
                  alt={FOUNDER.name}
                  className="size-full object-cover"
                />
              </div>
              <p className="mt-6 font-display text-2xl font-bold text-ink">{FOUNDER.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/50">
                {FOUNDER.role}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="u-display text-[length:var(--text-display)]">
                One violin, one <Script xl>diary</Script>
              </h2>

              <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink/70">
                {FOUNDER.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <p className="mt-10">
                <span className="u-script text-4xl">{FOUNDER.signature}</span>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The three acts */}
      <section className="shell py-20 md:py-28">
        <Reveal>
          <Movement label="The three acts" />
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="u-display mt-10 max-w-3xl text-[length:var(--text-display)]">
            Different rooms, different <Script xl>sizes</Script>
          </h2>
        </Reveal>

        <div className="mt-14 space-y-px border border-ink-line bg-ink-line">
          {BRAND_PROFILES.map((brand, index) => {
            const accent = ACCENT_CLASSES[brand.accent]
            const socials = socialsFor(brand.name)

            return (
              <Reveal
                key={brand.id}
                delay={index * 0.06}
                className="grid gap-6 bg-ink p-8 transition-colors duration-500 hover:bg-ink-raised md:grid-cols-[auto_1fr_auto] md:items-center md:gap-12 md:p-10"
              >
                <div className="flex items-center gap-4 md:w-64">
                  <span className={`size-2 shrink-0 rounded-full ${accent.dot}`} />
                  <div>
                    <h3 className="font-display text-2xl font-bold leading-tight">
                      {brand.name}
                    </h3>
                    <p className="u-eyebrow mt-1 text-[0.5625rem]">{brand.role}</p>
                  </div>
                </div>

                <p className="max-w-2xl text-ivory-dim">{brand.blurb}</p>

                <ul className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
                  {socials.map((social) => (
                    <li key={social.platform}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-ivory-faint transition-colors hover:text-gold-lift"
                      >
                        {social.platform}
                        <ArrowUpRight size={11} strokeWidth={1.5} />
                      </a>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Enquiries */}
      <section id="enquiries" className="wash-royal py-20 md:py-28">
        <div className="shell-narrow text-center">
          <Reveal>
            <Movement label="Enquiries" className="justify-center" />

            <h2 className="u-display mt-10 text-[length:var(--text-display)]">
              Tell us about the <Script xl>room</Script>
            </h2>

            <p className="mx-auto mt-8 max-w-lg text-lg text-ivory-dim">
              Send the date, the venue and roughly how many people. We will come back with
              what we would put in it and what it costs.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {contact?.email ? (
                <a href={`mailto:${contact.email}`} className="btn btn-solid btn-wrap">
                  <Mail size={15} strokeWidth={1.5} />
                  {emailUser}@<wbr />
                  {emailDomain}
                </a>
              ) : null}

              {contact?.phone ? (
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="btn btn-ghost">
                  <Phone size={15} strokeWidth={1.5} />
                  {contact.phone}
                </a>
              ) : null}
            </div>

            <p className="mt-10">
              <Link to="/events" className="u-meta transition-colors hover:text-gold-lift">
                Or see what is already on sale
              </Link>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
